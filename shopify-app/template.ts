// Edit this file to change the shopify.app.{env}.toml output — do not edit generated files directly

export interface TomlEnv {
  SHOPIFY_APP_CLIENT_ID: string;
  SHOPIFY_APP_NAME: string;
  APP_URL: string;
  API_URL: string;
  SHOPIFY_API_VERSION: string;
}

export function renderToml(env: TomlEnv): string {
  return `\
# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration
# Generated from shopify-app/template.ts — do not edit directly

client_id = "${env.SHOPIFY_APP_CLIENT_ID}"
name = "${env.SHOPIFY_APP_NAME}"
application_url = "${env.APP_URL}"
embedded = true

[webhooks]
api_version = "${env.SHOPIFY_API_VERSION}"

  [[webhooks.subscriptions]]
  topics = ["orders/paid"]
  uri = "${env.API_URL}/api/webhooks/orders/paid"

  [[webhooks.subscriptions]]
  topics = ["inventory_levels/update"]
  uri = "${env.API_URL}/api/webhooks/inventoryLevels/update"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "/webhooks/app/uninstalled"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "${env.API_URL}/api/webhooks/app/uninstalled"

[access_scopes]
scopes = "read_orders,read_all_orders,read_products,read_inventory,read_locations,write_inventory"

[auth]
redirect_urls = [
  "${env.APP_URL}",
  "${env.APP_URL}/api/auth/callback",
  "${env.APP_URL}/auth/callback",
  "${env.APP_URL}/auth/shopify/callback",
]

[build]
include_config_on_deploy = true
automatically_update_urls_on_dev = false
`;
}
