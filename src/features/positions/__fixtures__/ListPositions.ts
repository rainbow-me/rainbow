import type { ListPositionsResponse } from '../types/generated/positions/positions';
import { grandTotal } from './helpers/filters';

import successResponse from './ListPositions-success.json';
import emptyResponse from './ListPositions-success-empty.json';
import invalidAddressError from './ListPositions-error-invalid-address.json';
import invalidApiKeyError from './ListPositions-error-invalid-api-key.json';
import missingAddressError from './ListPositions-error-missing-address.json';

// ============ Constants ================================================ //

/**
 * Test wallet address used in fixtures
 */
export const FIXTURE_WALLET_ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';

/**
 * Test chain IDs
 */
export const FIXTURE_CHAIN_IDS = [1, 10, 56, 130, 137, 250, 324, 8453, 42161, 43114, 57073, 59144, 80094, 534352];

/**
 * Default test parameters
 */
export const FIXTURE_PARAMS = {
  address: FIXTURE_WALLET_ADDRESS,
  currency: 'USD' as const,
  chainIds: FIXTURE_CHAIN_IDS,
};

// ============ Responses ============================================= //

/**
 * Successful response with 60 positions across multiple protocols
 * Endpoint: https://platform.p.rainbow.me/v1/positions/ListPositions
 * Test wallet: 0x42b9df65b219b3dd36ff330a4dd8f327a6ada990
 * Currency: USD
 */
export const FIXTURE_LIST_POSITIONS_SUCCESS: ListPositionsResponse = successResponse as ListPositionsResponse;

/**
 * Successful response with no positions (empty array)
 * HTTP 200: Returns empty positions array
 */
export const FIXTURE_LIST_POSITIONS_SUCCESS_EMPTY: ListPositionsResponse = emptyResponse as ListPositionsResponse;

// ============ Error Responses =============================================== //

/**
 * Error when address format is invalid (not hex)
 * HTTP 400: "user address when sending a str, it must be a hex string"
 */
export const FIXTURE_LIST_POSITIONS_ERROR_INVALID_ADDRESS = invalidAddressError;

/**
 * Error when API key is invalid or missing
 * HTTP 401: "invalid API key provided" (code: 16)
 */
export const FIXTURE_LIST_POSITIONS_ERROR_INVALID_API_KEY = invalidApiKeyError;

/**
 * Error when address parameter is missing
 * HTTP 400: "user address unknown format , attempted to normalize to 0x:"
 */
export const FIXTURE_LIST_POSITIONS_ERROR_MISSING_ADDRESS = missingAddressError;

// ============ Derived Values ================================================ //

/**
 * Grand total from the backend stats for FIXTURE_LIST_POSITIONS_SUCCESS fixture
 */
export const FIXTURE_GRAND_TOTAL = grandTotal(FIXTURE_LIST_POSITIONS_SUCCESS);
