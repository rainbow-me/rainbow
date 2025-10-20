/**
 * Test fixtures for ListPositions API
 *
 * Contains both successful and error responses from the Platform API
 */

import type { ListPositionsResponse } from '../types/generated/positions/positions';

// Import JSON fixtures
import successResponse from './ListPositions-success.json';
import emptyResponse from './ListPositions-success-empty.json';
import invalidAddressError from './ListPositions-error-invalid-address.json';
import invalidApiKeyError from './ListPositions-error-invalid-api-key.json';
import missingAddressError from './ListPositions-error-missing-address.json';

// ============ Test Constants ================================================ //

/**
 * Test wallet address used in fixtures
 */
export const TEST_WALLET_ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';

/**
 * Test chain IDs
 */
export const TEST_CHAINIDS = [1, 10, 56, 130, 137, 250, 324, 8453, 42161, 43114, 57073, 59144, 80094, 534352];

/**
 * Default test parameters
 */
export const TEST_PARAMS = {
  address: TEST_WALLET_ADDRESS,
  currency: 'USD' as const,
  chainIds: TEST_CHAINIDS,
};

// ============ Success Responses ============================================= //

/**
 * Successful response with 60 positions across multiple protocols
 * Endpoint: https://platform.p.rainbow.me/v1/positions/ListPositions
 * Test wallet: 0x42b9df65b219b3dd36ff330a4dd8f327a6ada990
 * Currency: USD
 */
export const LIST_POSITIONS_SUCCESS: ListPositionsResponse = successResponse as ListPositionsResponse;

/**
 * Successful response with no positions (empty array)
 * HTTP 200: Returns empty positions array
 */
export const LIST_POSITIONS_SUCCESS_EMPTY: ListPositionsResponse = emptyResponse as ListPositionsResponse;

// ============ Error Responses =============================================== //

/**
 * Error when address format is invalid (not hex)
 * HTTP 400: "user address when sending a str, it must be a hex string"
 */
export const LIST_POSITIONS_ERROR_INVALID_ADDRESS = invalidAddressError;

/**
 * Error when API key is invalid or missing
 * HTTP 401: "invalid API key provided" (code: 16)
 */
export const LIST_POSITIONS_ERROR_INVALID_API_KEY = invalidApiKeyError;

/**
 * Error when address parameter is missing
 * HTTP 400: "user address unknown format , attempted to normalize to 0x:"
 */
export const LIST_POSITIONS_ERROR_MISSING_ADDRESS = missingAddressError;

// ============ Documentation ================================================= //

/**
 * Error scenarios captured from real API:
 *
 * 1. Invalid Address Format:
 *    curl -X GET "https://platform.p.rainbow.me/v1/positions/ListPositions?address=invalid-address&currency=usd"
 *    Response: 400 Bad Request
 *
 * 2. Invalid API Key:
 *    curl -X GET "https://platform.p.rainbow.me/v1/positions/ListPositions" -H "Authorization: Bearer invalid-key"
 *    Response: 401 Unauthorized
 *
 * 3. Missing Address:
 *    curl -X GET "https://platform.p.rainbow.me/v1/positions/ListPositions?currency=usd"
 *    Response: 400 Bad Request
 *
 * 4. Invalid Currency:
 *    curl -X GET "https://platform.p.rainbow.me/v1/positions/ListPositions?address=0x...&currency=INVALID"
 *    Response: 200 OK (returns positions with 0 values)
 *
 * 5. Empty Positions:
 *    Valid address with no DeFi positions
 *    Response: 200 OK with empty positions array
 */
