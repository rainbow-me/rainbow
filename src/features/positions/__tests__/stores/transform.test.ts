import { transformPositions } from '../../stores/transform';
import { EMPTY_POSITIONS } from '../../constants';
import { LIST_POSITIONS_SUCCESS, LIST_POSITIONS_SUCCESS_EMPTY, TEST_PARAMS } from '../../__fixtures__/ListPositions';
import type { ListPositionsResponse } from '../../types';

describe('transformPositions', () => {
  const defaultParams = TEST_PARAMS;

  it('should transform positions successfully', () => {
    const result = transformPositions(LIST_POSITIONS_SUCCESS, defaultParams);

    // Check that we have transformed positions
    expect(result).toBeDefined();
    expect(result.positions).toBeDefined();
    expect(Object.keys(result.positions).length).toBeGreaterThan(0);
    expect(result.totals).toBeDefined();
    expect(result.totals?.totals).toBeDefined();
  });

  it('should pass currency to parser', () => {
    const paramsWithEUR = {
      ...defaultParams,
      currency: 'EUR' as const,
    };

    const result = transformPositions(LIST_POSITIONS_SUCCESS, paramsWithEUR);

    // Should still transform successfully with different currency
    expect(result).toBeDefined();
    expect(result.positions).toBeDefined();
  });

  it('should handle empty response', () => {
    const result = transformPositions(LIST_POSITIONS_SUCCESS_EMPTY, defaultParams);

    // Should return empty positions structure
    expect(result).toBeDefined();
    expect(result.positions).toBeDefined();
    expect(Object.keys(result.positions).length).toBe(0);
    expect(result.totals?.totals?.amount).toBe('0');
  });

  it('should handle response with errors', () => {
    const responseWithErrors: ListPositionsResponse = {
      ...LIST_POSITIONS_SUCCESS,
      errors: ['Chain 10 failed', 'Chain 42161 failed'],
    };

    const result = transformPositions(responseWithErrors, defaultParams);

    // Should still transform positions despite errors
    expect(result).toBeDefined();
    expect(result.positions).toBeDefined();
    expect(Object.keys(result.positions).length).toBeGreaterThan(0);
  });

  it('should handle malformed response gracefully', () => {
    const malformedResponse: ListPositionsResponse = {
      result: undefined,
      metadata: undefined,
      errors: ['Failed to fetch'],
    };

    const result = transformPositions(malformedResponse, defaultParams);

    // Should return empty positions for malformed response
    expect(result).toEqual(EMPTY_POSITIONS);
  });

  it('should transform real fixture data correctly', () => {
    const result = transformPositions(LIST_POSITIONS_SUCCESS, defaultParams);

    // Verify the structure matches expected parsed format
    expect(result.positionTokens).toBeDefined();
    expect(Array.isArray(result.positionTokens)).toBe(true);

    // Check that we have protocol positions
    const protocolNames = Object.keys(result.positions);
    expect(protocolNames.length).toBeGreaterThan(0);

    // Check first position has expected structure
    const firstProtocol = protocolNames[0];
    const firstPosition = result.positions[firstProtocol];
    expect(firstPosition).toHaveProperty('type');
    expect(firstPosition).toHaveProperty('chainIds');
    expect(firstPosition).toHaveProperty('totals');
    expect(firstPosition).toHaveProperty('deposits');
    expect(firstPosition).toHaveProperty('pools');
    expect(firstPosition).toHaveProperty('stakes');
    expect(firstPosition).toHaveProperty('borrows');
    expect(firstPosition).toHaveProperty('rewards');
    expect(firstPosition).toHaveProperty('dapp');
  });

  it('should handle response with no result field', () => {
    const responseNoResult: ListPositionsResponse = {
      result: undefined,
      metadata: undefined,
      errors: [],
    };

    const result = transformPositions(responseNoResult, defaultParams);

    // Should return empty positions
    expect(result).toEqual(EMPTY_POSITIONS);
  });

  it('should handle response with null positions', () => {
    const responseNullPositions = {
      result: {
        positions: null,
        uniqueTokens: [],
      },
      metadata: undefined,
      errors: [],
    } as unknown as ListPositionsResponse;

    const result = transformPositions(responseNullPositions, defaultParams);

    // Should return empty positions
    expect(result).toEqual(EMPTY_POSITIONS);
  });
});
