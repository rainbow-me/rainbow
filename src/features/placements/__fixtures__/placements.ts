import { PLACEMENT_IDS, PLACEMENT_IDS_BY_SURFACE, PLACEMENT_SURFACES } from '../constants';
import { type Placement, type PlacementId } from '../types';
import perpsCommodities from './placements/perps_commodities.json';
import perpsCryptoMajors from './placements/perps_crypto_majors.json';
import perpsIndices from './placements/perps_indices.json';
import perpsStocksNew from './placements/perps_stocks_new.json';
import perpsStocks from './placements/perps_stocks.json';
import perps from './placements/perps.json';
import predictionsCrypto from './placements/predictions_crypto.json';
import predictionsSportsToday from './placements/predictions_sports_today.json';
import predictionsSportsWeek from './placements/predictions_sports_week.json';
import predictionsSports from './placements/predictions_sports.json';
import predictionsTradfi from './placements/predictions_tradfi.json';
import predictions from './placements/predictions.json';
import tokens from './placements/tokens.json';

export const FIXTURE_V2_PLACEMENTS_BY_ID = {
  [PLACEMENT_IDS.PERPS]: perps as Placement,
  [PLACEMENT_IDS.PREDICTIONS]: predictions as Placement,
  [PLACEMENT_IDS.TOKENS]: tokens as Placement,
  [PLACEMENT_IDS.PERPS_INDICES]: perpsIndices as Placement,
  [PLACEMENT_IDS.PERPS_COMMODITIES]: perpsCommodities as Placement,
  [PLACEMENT_IDS.PERPS_STOCKS]: perpsStocks as Placement,
  [PLACEMENT_IDS.PERPS_STOCKS_NEW]: perpsStocksNew as Placement,
  [PLACEMENT_IDS.PERPS_CRYPTO_MAJORS]: perpsCryptoMajors as Placement,
  [PLACEMENT_IDS.PREDICTIONS_TRADFI]: predictionsTradfi as Placement,
  [PLACEMENT_IDS.PREDICTIONS_CRYPTO]: predictionsCrypto as Placement,
  [PLACEMENT_IDS.PREDICTIONS_SPORTS]: predictionsSports as Placement,
  [PLACEMENT_IDS.PREDICTIONS_SPORTS_TODAY]: predictionsSportsToday as Placement,
  [PLACEMENT_IDS.PREDICTIONS_SPORTS_WEEK]: predictionsSportsWeek as Placement,
} satisfies Record<PlacementId, Placement>;

export const FIXTURE_V2_PLACEMENTS = PLACEMENT_IDS_BY_SURFACE[PLACEMENT_SURFACES.DISCOVER].map(id => FIXTURE_V2_PLACEMENTS_BY_ID[id]);
