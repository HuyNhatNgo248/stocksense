import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const apiUrl = process.env.API_URL ?? "";

  if (shop && code) {
    return redirect(`${apiUrl}/api/auth/callback?${url.searchParams.toString()}`);
  }

  return redirect(`/app?${url.searchParams.toString()}`);
};

export default function Index() {
  return null;
}
