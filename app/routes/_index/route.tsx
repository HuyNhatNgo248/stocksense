import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const hmac = url.searchParams.get("hmac") ?? "";
  const apiUrl = process.env.API_URL ?? "";

  if (shop && code && hmac) {
    const params = new URLSearchParams({ code, hmac, shop });
    return redirect(`${apiUrl}/api/auth/callback?${params}`);
  }

  return redirect(`/app?${url.searchParams.toString()}`);
};

export default function Index() {
  return null;
}
