import { type Placement, type PlacementId } from '../types';
import perpsCommodities from './placements/perps_commodities.json';
import perpsCryptoMajors from './placements/perps_crypto_majors.json';
import perpsIndices from './placements/perps_indices.json';
import perpsStocksNew from './placements/perps_stocks_new.json';
import perpsStocks from './placements/perps_stocks.json';
import perps from './placements/perps.json';
import predictionsCrypto from './placements/predictions_crypto.json';
import predictionsSportsLive from './placements/predictions_sports_live.json';
import predictionsSportsNba from './placements/predictions_sports_nba.json';
import predictionsSportsToday from './placements/predictions_sports_today.json';
import predictionsSportsWeek from './placements/predictions_sports_week.json';
import predictionsTradfi from './placements/predictions_tradfi.json';
import predictions from './placements/predictions.json';
import tokens from './placements/tokens.json';

export const FIXTURE_V2_PLACEMENTS_BY_ID = {
  [perps.id]: perps as Placement,
  [predictions.id]: predictions as Placement,
  [tokens.id]: tokens as Placement,
  [perpsIndices.id]: perpsIndices as Placement,
  [perpsCommodities.id]: perpsCommodities as Placement,
  [perpsStocks.id]: perpsStocks as Placement,
  [perpsStocksNew.id]: perpsStocksNew as Placement,
  [perpsCryptoMajors.id]: perpsCryptoMajors as Placement,
  [predictionsTradfi.id]: predictionsTradfi as Placement,
  [predictionsCrypto.id]: predictionsCrypto as Placement,
  [predictionsSportsLive.id]: predictionsSportsLive as Placement,
  [predictionsSportsToday.id]: predictionsSportsToday as Placement,
  [predictionsSportsWeek.id]: predictionsSportsWeek as Placement,
  [predictionsSportsNba.id]: predictionsSportsNba as Placement,
} satisfies Record<PlacementId, Placement>;

export const FIXTURE_V2_PLACEMENTS = Object.values(FIXTURE_V2_PLACEMENTS_BY_ID);
