import { MeteorologyLegacyResponse, MeteorologyResponse } from '@/entities/gas';

type MeteorologyData = MeteorologyLegacyResponse | MeteorologyResponse;

/**
 * Classifies meteorology payloads by fee model.
 * Uses `meta.feeType` first, then falls back to payload-shape checks.
 */
export function isLegacyMeteorologyFeeData(meteorologyData: MeteorologyData): meteorologyData is MeteorologyLegacyResponse {
  const feeType = meteorologyData.meta?.feeType;
  if (feeType === 'legacy') return true;
  if (feeType === 'eip1559') return false;

  const hasLegacyPayload = 'legacy' in meteorologyData.data;
  const hasEip1559Payload = 'baseFeeSuggestion' in meteorologyData.data;
  if (hasLegacyPayload && !hasEip1559Payload) return true;

  return false;
}
