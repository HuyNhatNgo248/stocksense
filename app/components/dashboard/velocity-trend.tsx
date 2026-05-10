import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VelocityHistory } from "@/types/api";

export function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
}

export function VelocityTrend({ data }: { data: VelocityHistory }) {
  const avg = useMemo(() => {
    const sold = data
      .filter((d) => d.unitsSold != null)
      .map((d) => d.unitsSold as number);
    return sold.length ? sold.reduce((a, b) => a + b, 0) / sold.length : 0;
  }, [data]);

  return (
    <div>
      <div className="flex gap-3 mb-2 flex-wrap text-[10px] text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
          Daily Sales
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-yellow-400" />
          EWMA
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-dashed border-blue-400" />
          Average (μ = {avg.toFixed(2)})
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 9 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #e5e7eb",
            }}
            formatter={(value, name) => [
              value == null
                ? "—"
                : typeof value === "number"
                  ? value.toFixed(2)
                  : value,
              name === "ewmaVelocity"
                ? "EWMA"
                : name === "unitsSold"
                  ? "Daily Sales"
                  : String(name),
            ]}
            labelFormatter={(l) => (typeof l === "string" ? formatDate(l) : l)}
          />
          <Bar dataKey="unitsSold" fill="#22c55e" maxBarSize={10} />
          <Line
            type="monotone"
            dataKey="ewmaVelocity"
            stroke="#eab308"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <ReferenceLine
            y={avg}
            stroke="#60a5fa"
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
