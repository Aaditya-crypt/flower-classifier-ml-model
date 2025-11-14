import { Check } from "lucide-react";

interface FactsListProps {
  facts: string[];
  title?: string;
}

export const FactsList = ({ facts, title = "Key Facts" }: FactsListProps) => {
  if (!facts || facts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2">
        {facts.map((fact, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
