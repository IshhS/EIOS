import type { ServiceStatus } from "@/lib/api";

export type StatusKey = ServiceStatus;

/** Status carries a stripe, a fill for SVG nodes, and a written label.
 *
 * The label is not decoration: colour alone would leave the health column
 * unreadable to anyone who cannot separate the teal from the amber.
 */
export const STATUS: Record<
  StatusKey,
  { stripe: string; fill: string; text: string; label: string; rank: number }
> = {
  critical: {
    stripe: "bg-destructive",
    fill: "fill-destructive",
    text: "text-destructive",
    label: "Critical",
    rank: 0,
  },
  degraded: {
    stripe: "bg-warning",
    fill: "fill-warning",
    text: "text-warning",
    label: "Degraded",
    rank: 1,
  },
  healthy: {
    stripe: "bg-primary",
    fill: "fill-primary",
    text: "text-primary",
    label: "Healthy",
    rank: 2,
  },
  idle: {
    stripe: "bg-muted-foreground/50",
    fill: "fill-muted-foreground/50",
    text: "text-muted-foreground",
    label: "Idle",
    rank: 3,
  },
  unknown: {
    stripe: "bg-muted-foreground/25",
    fill: "fill-muted-foreground/25",
    text: "text-muted-foreground",
    label: "No data",
    rank: 4,
  },
};

export const STATUS_ORDER: StatusKey[] = [
  "critical",
  "degraded",
  "healthy",
  "idle",
  "unknown",
];
