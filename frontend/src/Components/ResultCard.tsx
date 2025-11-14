import { useState } from "react";
import { ChevronDown, MapPin, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Badge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { FactsList } from "@/components/FactsList";
import { getFlowerInfo } from "@/lib/api";
import type { PredictResponse, InfoResponse } from "@/types/flower";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  result: PredictResponse;
}

export const ResultCard = ({ result }: ResultCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<InfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLearnMore = async () => {
    if (isExpanded && detailedInfo) {
      setIsExpanded(false);
      return;
    }

    if (!detailedInfo) {
      setIsLoading(true);
      setError(null);
      
      try {
        const info = await getFlowerInfo(result.class_id);
        setDetailedInfo(info);
        setIsExpanded(true);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load detailed information');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-large overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">{result.common_name}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                <span>ID:</span>
                <span className="font-mono">{result.class_id}</span>
              </div>
            </div>
            <StatusBadge isPoisonous={result.poisonous} />
          </div>

          <ConfidenceBar confidence={result.confidence} />
        </div>

        {/* Poison Note */}
        {result.poison_note && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">{result.poison_note}</p>
          </div>
        )}

        {/* Info Pills */}
        <div className="space-y-3">
          {result.bloom_season && result.bloom_season.length > 0 && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">Bloom Season</p>
                <div className="flex flex-wrap gap-2">
                  {result.bloom_season.map((season, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                    >
                      {season}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.where_found && result.where_found.length > 0 && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">Where Found</p>
                <div className="flex flex-wrap gap-2">
                  {result.where_found.map((location, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Facts */}
        {result.specialties && result.specialties.length > 0 && (
          <FactsList facts={result.specialties} />
        )}

        {/* General Nature */}
        {result.general_nature && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{result.general_nature}</p>
          </div>
        )}

        {/* Learn More Button */}
        <Button
          onClick={handleLearnMore}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          <Info className="w-4 h-4 mr-2" />
          {isLoading ? 'Loading...' : isExpanded ? 'Show Less' : 'Learn More'}
          <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", isExpanded && "rotate-180")} />
        </Button>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && detailedInfo && (
          <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-semibold text-foreground">Detailed Information</h3>
            
            {detailedInfo.specialties && detailedInfo.specialties.length > 0 && (
              <FactsList facts={detailedInfo.specialties} title="Complete Characteristics" />
            )}
            
            {detailedInfo.general_nature && (
              <div className="bg-gradient-subtle rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">About This Flower</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detailedInfo.general_nature}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
