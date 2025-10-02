import { NativeCurrencyKey } from '@/entities';
import { AddysPositionsResponse, RainbowPositions } from './types';
import { parsePositions } from './utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '@/resources/addys/client';
import { logger } from '@/logger';
import { Address } from 'viem';

const STABLE_POSITIONS_OBJECT: RainbowPositions = {
  totals: {
    totals: { amount: '0', display: '0' },
    totalLocked: '0',
    borrows: { amount: '0', display: '0' },
    claimables: { amount: '0', display: '0' },
    deposits: { amount: '0', display: '0' },
    stakes: { amount: '0', display: '0' },
    total: { amount: '0', display: '0' },
  },
  positionTokens: [],
  positions: {},
};

export const getPositions = async (
  { address, currency }: { address: Address | string; currency: NativeCurrencyKey },
  abortController: AbortController | null
): Promise<RainbowPositions> => {
  if (!address) return STABLE_POSITIONS_OBJECT;

  const networkString = useBackendNetworksStore.getState().getSupportedChainIds().join(',');
  const url = `/${networkString}/${address}/positions`;
  const response = await getAddysHttpClient().get<AddysPositionsResponse>(url, {
    params: {
      currency,
      enableThirdParty: 'true',
    },
    signal: abortController?.signal,
  });

  if (response.data) return parsePositions(response.data, currency);

  logger.warn('[getPositions]: Positions response data is empty', { response });
  return STABLE_POSITIONS_OBJECT;
};
