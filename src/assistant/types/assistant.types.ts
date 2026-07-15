import type {
  RecommendationCandidate,
  RecommendationCandidateInput,
} from '../../listings/types';

export type AssistantMessageRole = 'assistant' | 'user';
export type VehicleRecommendationStatus =
  'clarifying' | 'completed' | 'degraded';

export interface AssistantMessage {
  content: string;
  role: AssistantMessageRole;
}

export interface VehicleRecommendationInput {
  history?: readonly AssistantMessage[];
  message: string;
}

export interface VehicleNeedsAnalysis {
  clarificationQuestion: string | null;
  criteria: RecommendationCandidateInput;
  needsClarification: boolean;
  preferences: string[];
}

export interface CandidateRanking {
  highlights: string[];
  listingId: string;
  reason: string;
  tradeoffs: string[];
}

export interface CandidateRankingResult {
  recommendations: CandidateRanking[];
  summary: string;
}

export interface RankCandidatesInput {
  candidates: readonly RecommendationCandidate[];
  conversation: readonly AssistantMessage[];
  needs: VehicleNeedsAnalysis;
}

export interface RecommendationModel {
  analyzeNeeds(
    conversation: readonly AssistantMessage[],
  ): Promise<VehicleNeedsAnalysis>;
  rankCandidates(input: RankCandidatesInput): Promise<CandidateRankingResult>;
}

export interface VehicleRecommendation {
  highlights: string[];
  listing: RecommendationCandidate;
  reason: string | null;
  tradeoffs: string[];
}

export interface VehicleRecommendationResult {
  message: string;
  recommendations: VehicleRecommendation[];
  status: VehicleRecommendationStatus;
}
