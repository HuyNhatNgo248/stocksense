import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const embedded = url.searchParams.get("embedded");
  const idToken = url.searchParams.get("id_token");

  // Install flow: Shopify sends shop+hmac but no embedded session yet
  if (shop && !embedded && !idToken) {
    const apiUrl = process.env.API_URL ?? "";
    return redirect(`${apiUrl}/api/auth/install?${url.searchParams.toString()}`);
  }

  return redirect(`/app?${url.searchParams.toString()}`);
};

export default function Index() {
  return null;
}
