import { cn } from "@/lib/cn";

interface MetricProps {
  label: string;
  value: string;
  valueClass?: string;
  subtext?: string;
}

export function Metric({ label, value, valueClass, subtext }: MetricProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
        {label}
      </span>
      <span className={cn("text-2xl font-bold", valueClass ?? "text-gray-900")}>
        {value}
      </span>
      {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
    </div>
  );
}
