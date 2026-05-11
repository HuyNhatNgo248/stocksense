import { AreaChart, Area, ResponsiveContainer } from "recharts";

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
    <div className="w-full h-10 rounded animate-pulse bg-gray-200" />
  ) : (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={velocityData}>
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
    </ResponsiveContainer>
  );
}
