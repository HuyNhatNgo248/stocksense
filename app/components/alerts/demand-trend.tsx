import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Box } from "@shopify/polaris";

import type { VelocityHistory, Forecast } from "@/types/api";

type DemandTrendTone = "critical" | "caution";

const TONE_COLOR: Record<DemandTrendTone, string> = {
  critical: "#8e1c00",
  caution: "#745400",
};

interface DemandTrendProps {
  velocityData: VelocityHistory | null;
  velocityLoading: boolean;
  forecast: Forecast;
  tone?: DemandTrendTone;
}

export function DemandTrend({
  velocityData,
  velocityLoading,
  forecast,
  tone = "caution",
}: DemandTrendProps) {
  if (velocityLoading || !velocityData) {
    return (
      <Box
        minHeight="40px"
        background="bg-surface-secondary"
        borderRadius="100"
      />
    );
  }

  const color = TONE_COLOR[tone];

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={velocityData}>
        <defs>
          <linearGradient
            id={`spark-${forecast.id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="ewmaVelocity"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${forecast.id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
