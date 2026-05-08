import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { parse as parseEnv } from "dotenv";
import { renderToml, type TomlEnv } from "./template.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

type Env = "development" | "staging" | "production";

class Deployer {
  private static readonly ENVS: Env[] = [
    "development",
    "staging",
    "production",
  ];

  private readonly root = resolve(__dirname, "..");

  /** Parses `--environment`/`-e` from argv, returning the env name and any remaining args to forward to the Shopify CLI. */
  private extractOpts(args: string[]): {
    environment: string;
    message: string | undefined;
    forwardedArgs: string[];
  } {
    const { values, positionals } = parseArgs({
      args,
      options: {
        environment: { type: "string", short: "e", default: "development" },
        message: { type: "string", short: "m" },
      },
      allowPositionals: true,
      allowNegative: false,
    });

    return { environment: values.environment!, message: values.message, forwardedArgs: positionals };
  }

  /** Asserts that `env` is one of the known deployment environments, throwing if not. */
  private validateEnv(env: string): asserts env is Env {
    if (!Deployer.ENVS.includes(env as Env)) {
      throw new Error(
        `Invalid environment: ${env}. Must be one of: ${Deployer.ENVS.join(", ")}`,
      );
    }
  }

  /** Loads env vars from `shopify-app/.{env}.env`, falling back to `process.env` if the file does not exist. */
  private loadEnvVars(env: Env): Record<string, string> {
    const path = join(__dirname, `.${env}.env`);

    if (existsSync(path)) {
      console.log(`Loading variables from: ${path}`);
      return parseEnv(readFileSync(path, "utf-8"));
    }

    console.warn(
      `Env file not found: ${path}. Falling back to process environment.`,
    );
    return process.env as Record<string, string>;
  }

  /** Extracts and validates all vars required by the TOML template, throwing on the first missing key. */
  private requireTomlEnv(vars: Record<string, string>): TomlEnv {
    const keys: (keyof TomlEnv)[] = [
      "SHOPIFY_APP_CLIENT_ID",
      "SHOPIFY_APP_NAME",
      "SHOPIFY_APP_URL",
      "SHOPIFY_API_VERSION",
    ];

    const result: Partial<TomlEnv> = {};
    for (const key of keys) {
      const value = vars[key];
      if (!value)
        throw new Error(`Missing required environment variable: ${key}`);
      result[key] = value;
    }

    return result as TomlEnv;
  }

  /** Reads the Shopify API version from `.shopify-api-version` at the repo root, falling back to `SHOPIFY_API_VERSION` in `vars`. */
  private readApiVersion(vars: Record<string, string>): string {
    const versionFile = join(this.root, ".shopify-api-version");
    if (existsSync(versionFile)) {
      return readFileSync(versionFile, "utf-8").trim();
    }
    return vars["SHOPIFY_API_VERSION"] ?? "";
  }

  /** Renders the TOML template with the resolved vars and writes it to `shopify.app.{env}.toml` at the repo root. */
  private processTemplate(env: Env, vars: Record<string, string>): void {
    console.log("Processing Shopify template...");

    const tomlEnv = this.requireTomlEnv({
      ...vars,
      SHOPIFY_API_VERSION: this.readApiVersion(vars),
    });
    const rendered = renderToml(tomlEnv);
    const outPath = join(this.root, `shopify.app.${env}.toml`);

    writeFileSync(outPath, rendered, "utf-8");
    console.log(`Written to ${outPath}`);
  }

  /** Runs `shopify app deploy --no-release --config=shopify.app.{env}.toml`, forwarding any extra CLI args. Throws on non-zero exit. */
  private deploy(env: Env, message: string | undefined, forwardedArgs: string[]): void {
    console.log("Deploying to Shopify...");

    const args = [
      "app",
      "deploy",
      "--no-release",
      `--config=shopify.app.${env}.toml`,
      ...(message ? [`--message=${message}`] : []),
      ...forwardedArgs,
    ];
    console.log(`Running: shopify ${args.join(" ")}`);

    const result = spawnSync("shopify", args, { stdio: "inherit" });

    if (result.status !== 0) {
      throw new Error(`Deployment to ${env} failed`);
    }
  }

  /** Entry point: parses argv, validates the environment, processes the template, and runs the deployment. */
  run(args: string[]): void {
    const { environment, message, forwardedArgs } = this.extractOpts(args);
    this.validateEnv(environment);

    const vars = this.loadEnvVars(environment);
    this.processTemplate(environment, vars);
    this.deploy(environment, message, forwardedArgs);

    console.log(`Successfully deployed to ${environment}`);
  }
}

new Deployer().run(process.argv.slice(2));
