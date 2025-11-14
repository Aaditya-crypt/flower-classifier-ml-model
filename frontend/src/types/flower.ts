export type PredictResponse = {
  class_id: string;
  common_name: string;
  confidence: number; // 0..1
  poisonous: boolean;
  poison_note: string;
  specialties: string[];
  where_found: string[];
  bloom_season: string[];
  general_nature: string;
};

export type InfoResponse = Omit<PredictResponse, "confidence">;

export type ApiError = {
  detail?: string;
  message?: string;
};
