import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const apiUrl = process.env.API_URL ?? "";

  const response = await fetch(`${apiUrl}/api/auth/callback${url.search}`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    redirect: "manual",
  });

  const location = response.headers.get("location");
  if (location) return redirect(location);

  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "text/plain" },
  });
};
