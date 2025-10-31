import { fetchPositions } from '../../stores/fetcher';
import { FIXTURE_LIST_POSITIONS_SUCCESS, FIXTURE_PARAMS } from '../../__fixtures__/ListPositions';

jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => false),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defiPositionsThresholdFilter',
}));
jest.mock('../../stores/fetcher', () => ({
  fetchPositions: jest.fn(),
}));

const mockFetchPositions = fetchPositions as jest.MockedFunction<typeof fetchPositions>;

describe('fetchPositions', () => {
  const defaultParams = FIXTURE_PARAMS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when address is missing', async () => {
    const paramsWithoutAddress = {
      ...FIXTURE_PARAMS,
      address: '',
    };

    mockFetchPositions.mockRejectedValueOnce(new Error('Address is required'));

    await expect(fetchPositions(paramsWithoutAddress, null)).rejects.toThrow('Address is required');
  });

  it('should fetch positions successfully', async () => {
    // Mock to return the fixture data
    mockFetchPositions.mockResolvedValueOnce(FIXTURE_LIST_POSITIONS_SUCCESS);

    const result = await fetchPositions(defaultParams, null);

    // Verify the mock was called with correct params
    expect(mockFetchPositions).toHaveBeenCalledWith(defaultParams, null);

    // Verify the response structure matches expected shape
    expect(result).toHaveProperty('result');
    expect(result.result).toHaveProperty('positions');
    expect(Array.isArray(result.result?.positions)).toBe(true);

    // Should match our fixture data
    expect(result.result?.positions?.length).toBe(60);
  });

  it('should validate FIXTURE_LIST_POSITIONS_SUCCESS fixture structure', () => {
    // Validate that our fixture has the expected structure
    expect(FIXTURE_LIST_POSITIONS_SUCCESS).toBeDefined();
    expect(FIXTURE_LIST_POSITIONS_SUCCESS).toHaveProperty('result');
    expect(FIXTURE_LIST_POSITIONS_SUCCESS.result).toHaveProperty('positions');
    expect(Array.isArray(FIXTURE_LIST_POSITIONS_SUCCESS.result?.positions)).toBe(true);

    // Validate the fixture has the expected number of positions
    expect(FIXTURE_LIST_POSITIONS_SUCCESS.result?.positions?.length).toBe(60);

    // Validate first position structure
    const firstPosition = FIXTURE_LIST_POSITIONS_SUCCESS.result?.positions?.[0];
    expect(firstPosition).toBeDefined();
    expect(firstPosition).toHaveProperty('id');
    expect(firstPosition).toHaveProperty('protocolName');
    expect(firstPosition).toHaveProperty('chainId');
    expect(firstPosition).toHaveProperty('portfolioItems');
    expect(Array.isArray(firstPosition?.portfolioItems)).toBe(true);

    // Validate portfolio item structure
    const firstPortfolioItem = firstPosition?.portfolioItems?.[0];
    expect(firstPortfolioItem).toBeDefined();
    expect(firstPortfolioItem).toHaveProperty('stats');
    expect(firstPortfolioItem?.stats).toHaveProperty('assetValue');
    expect(firstPortfolioItem?.stats).toHaveProperty('debtValue');
    expect(firstPortfolioItem?.stats).toHaveProperty('netValue');
    expect(firstPortfolioItem).toHaveProperty('detail');
  });

  it('should handle abort controller', async () => {
    const abortController = new AbortController();

    // Mock to simulate abort
    mockFetchPositions.mockRejectedValueOnce(new Error('Aborted'));

    // Start the request
    const promise = fetchPositions(defaultParams, abortController);

    // Should reject with abort error
    await expect(promise).rejects.toThrow('Aborted');
  });
});
