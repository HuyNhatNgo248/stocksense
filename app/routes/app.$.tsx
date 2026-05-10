import { useLocation } from "react-router";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <s-page heading="Page not found" inlineSize="small">
      <s-box background="base" borderRadius="base" padding="large">
        <s-stack gap="base" alignItems="center">
          <h1 className="text-4xl font-bold">404</h1>
          <s-stack gap="small-300" alignItems="center">
            <s-heading>This page doesn&apos;t exist</s-heading>
            <s-text color="subdued">
              <code>{pathname}</code> could not be found.
            </s-text>
          </s-stack>
          <s-button variant="primary" href="/app">
            Back to dashboard
          </s-button>
        </s-stack>
      </s-box>
    </s-page>
  );
}
