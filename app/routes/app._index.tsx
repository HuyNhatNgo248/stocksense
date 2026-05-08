import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

export default function Index() {
  return (
    <s-page heading="StockSense">
      <s-section heading="Dashboard">
        <s-paragraph>Welcome to StockSense.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
