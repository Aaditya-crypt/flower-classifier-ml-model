import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  confidence: number; // 0-1
  className?: string;
}

export const ConfidenceBar = ({ confidence, className }: ConfidenceBarProps) => {
  const percentage = Math.round(confidence * 100);
  
  const getColor = (conf: number) => {
    if (conf >= 0.8) return "bg-success";
    if (conf >= 0.6) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">Confidence</span>
        <span className="font-bold text-foreground">{percentage}%</span>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
            getColor(confidence)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
