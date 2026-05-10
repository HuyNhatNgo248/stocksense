type TextTone =
  | "info"
  | "success"
  | "warning"
  | "critical"
  | "auto"
  | "neutral"
  | "caution";

interface MetricProps {
  label: string;
  value: string;
  urgent?: boolean;
  displayAsBadge?: {
    tone: TextTone;
  };
}

export function Metric({ label, value, urgent, displayAsBadge }: MetricProps) {
  const tone: TextTone | undefined = urgent ? "critical" : undefined;

  return (
    <s-stack gap="small-100">
      <s-heading>{label}</s-heading>
      {displayAsBadge ? (
        <s-badge tone={displayAsBadge.tone}>{value}</s-badge>
      ) : (
        <s-text tone={tone}>{value}</s-text>
      )}
    </s-stack>
  );
}
