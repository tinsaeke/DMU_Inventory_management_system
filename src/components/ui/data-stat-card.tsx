import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DataStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-card border-border',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
  primary: {
    card: 'bg-primary/5 border-primary/20',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
  success: {
    card: 'bg-success/5 border-success/20',
    icon: 'bg-success/10 text-success',
    value: 'text-success',
  },
  warning: {
    card: 'bg-warning/5 border-warning/20',
    icon: 'bg-warning/10 text-warning',
    value: 'text-warning',
  },
  danger: {
    card: 'bg-destructive/5 border-destructive/20',
    icon: 'bg-destructive/10 text-destructive',
    value: 'text-destructive',
  },
  info: {
    card: 'bg-info/5 border-info/20',
    icon: 'bg-info/10 text-info',
    value: 'text-info',
  },
};

export function DataStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: DataStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 shadow-institutional transition-shadow hover:shadow-card",
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={cn("text-2xl font-bold tabular-nums", styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
