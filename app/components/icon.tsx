import { icons, type LucideIcon } from "lucide-react";

export type IconName = keyof typeof icons;

interface IconProps {
  icon: IconName;
  size?: number;
  className?: string;
}

export function Icon({ icon, size = 16, className }: IconProps) {
  // eslint-disable-next-line import/namespace
  const LucideIcon = icons[icon] as LucideIcon;
  return <LucideIcon size={size} className={className} />;
}
