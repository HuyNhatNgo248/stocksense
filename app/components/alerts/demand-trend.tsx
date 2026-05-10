import { AreaChart, Area } from "recharts";

import type { VelocityHistory, Forecast } from "@/types/api";

interface DemandTrendProps {
  velocityData: VelocityHistory | null;
  velocityLoading: boolean;
  forecast: Forecast;
}

export function DemandTrend({
  velocityData,
  velocityLoading,
  forecast,
}: DemandTrendProps) {
  return velocityLoading || !velocityData ? (
    <div className="w-20 h-10 rounded animate-pulse bg-gray-200" />
  ) : (
    <AreaChart width={80} height={40} data={velocityData}>
      <defs>
        <linearGradient id={`spark-${forecast.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="ewmaVelocity"
        stroke="#eab308"
        strokeWidth={1.5}
        fill={`url(#spark-${forecast.id})`}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  );
}
