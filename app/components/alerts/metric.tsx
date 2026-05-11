import { cn } from "@/lib/cn";

interface MetricProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  classNames?: {
    icon?: string;
    value?: string;
  };
}

export function Metric({ label, value, icon, classNames }: MetricProps) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100",
            classNames?.icon,
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className={cn("text-xl font-semibold", classNames?.value)}>
          {value}
        </span>
      </div>
    </div>
  );
}
