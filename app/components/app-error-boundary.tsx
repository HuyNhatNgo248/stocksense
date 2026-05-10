import { useNavigate, useRouteError } from "react-router";

export function AppErrorBoundary({ heading }: { heading: string }) {
  const error = useRouteError();
  const navigate = useNavigate();
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <s-page heading={heading} inlineSize="large">
      <s-box background="base" borderRadius="base" padding="large">
        <s-stack gap="base" alignItems="center">
          <s-heading>Something went wrong</s-heading>
          <s-text color="subdued">{message}</s-text>
          <s-button variant="primary" onClick={() => navigate(0)}>
            Retry
          </s-button>
        </s-stack>
      </s-box>
    </s-page>
  );
}
