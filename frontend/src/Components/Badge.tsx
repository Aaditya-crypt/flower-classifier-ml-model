import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  isPoisonous: boolean;
  className?: string;
}

export const StatusBadge = ({ isPoisonous, className }: StatusBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
        isPoisonous
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-success/10 text-success border border-success/20",
        className
      )}
    >
      {isPoisonous ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      <span>{isPoisonous ? "Poisonous" : "Non-poisonous"}</span>
    </div>
  );
};
