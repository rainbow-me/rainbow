import { NativeCurrencyKey } from '@/entities';
import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { logger, RainbowError } from '@/logger';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from './client';
import useAccountSettings from '@/hooks/useAccountSettings';
import { Address } from 'viem';

// ///////////////////////////////////////////////
// Types

interface InteractionTransaction {
  id: string;
  type: string;
  chain_id: number;
  network: string;
  block_number: number;
  mined_at: number;
  status: string;
  hash: string;
  direction: string;
  address_from: string;
  address_to: string;
  nonce: number;
  changes: unknown[]; // Define more specific type if needed
  fee: {
    value: number;
    price: number;
  };
  meta: {
    action?: string;
    contract_name?: string;
    fourbyte?: string;
    explorer_label?: string;
    explorer_url?: string;
    type?: string;
  };
}

interface InteractionsResponseMetadataErrorDetail {
  chain_id: number;
  error: string;
}

interface InteractionsResponseMetadataError {
  address: string;
  errors: InteractionsResponseMetadataErrorDetail[];
}

interface InteractionsResponseMetadata {
  addresses: string[];
  currency: string;
  chain_ids: number[];
  current_page_cursor: string;
  errors?: InteractionsResponseMetadataError[];
  addresses_with_errors?: string[];
  chain_ids_with_errors?: number[];
  status: 'ok' | 'error';
  interactions_with: string;
}

interface InteractionsResponsePayload {
  transactions: InteractionTransaction[];
}

interface InteractionsResponse {
  meta: InteractionsResponseMetadata;
  payload: InteractionsResponsePayload;
}

export interface InteractionsCountArgs {
  fromAddress?: string;
  toAddress: string;
  currency?: NativeCurrencyKey;
  chainId?: number; // Optional chainId for specific count
}

// ///////////////////////////////////////////////
// Query Key

// Query key remains the same, fetching all transactions for the given addresses
export function interactionsCountQueryKey({
  fromAddress,
  toAddress,
  currency,
}: Required<Omit<InteractionsCountArgs, 'chainId'> & { currency: NativeCurrencyKey }>) {
  return createQueryKey(
    'interactionsCount',
    { fromAddress: fromAddress.toLowerCase(), toAddress: toAddress.toLowerCase(), currency },
    { persisterVersion: 1 }
  );
}

type InteractionsCountQueryKey = ReturnType<typeof interactionsCountQueryKey>;

// ///////////////////////////////////////////////
// Query Function

// Function now returns the list of transactions
export async function interactionsCountQueryFunction({
  queryKey,
}: QueryFunctionContext<InteractionsCountQueryKey>): Promise<InteractionTransaction[]> {
  const [{ fromAddress, toAddress, currency }] = queryKey;
  const supportedChainIds = useBackendNetworksStore.getState().getInteractionsWithSupportedChainIds();

  if (!fromAddress || !toAddress || supportedChainIds.length === 0) {
    logger.warn('[interactionsCountQueryFunction]: Missing address or supported chains, returning empty array.');
    return []; // Return empty array if params missing
  }

  const url = `/${supportedChainIds.join(',')}/${fromAddress}/transactions`;

  try {
    const { data } = await getAddysHttpClient().get<InteractionsResponse>(url, {
      params: {
        currency: currency.toLowerCase(),
        interactions_with: toAddress,
      },
      timeout: 20000,
    });

    if (data.meta.status !== 'ok' && data.meta.errors) {
      logger.warn('[interactionsCountQueryFunction]: API returned errors for interactions count', {
        apiErrors: data.meta.errors,
        fromAddress,
        toAddress,
        chainIds: supportedChainIds,
      });
    }

    // Return the full transaction list, or empty array if none
    return data.payload?.transactions ?? [];
  } catch (error) {
    logger.error(new RainbowError('[interactionsCountQueryFunction]: Failed to fetch interactions count'), {
      message: (error as Error)?.message,
      fromAddress,
      toAddress,
      currency,
      chainIds: supportedChainIds,
    });
    return []; // Return empty array on error
  }
}

// Result type is now the array of transactions
export type InteractionsCountResult = InteractionTransaction[];

// Define the structure returned by the hook's select function
export interface SelectedInteractionsCount {
  totalCount: number;
  specificChainCount: number | undefined;
}

// ///////////////////////////////////////////////
// Query Hook

export function useInteractionsCount(
  { fromAddress: inputFromAddress, toAddress, currency: inputCurrency, chainId }: InteractionsCountArgs,
  config: QueryConfigWithSelect<InteractionsCountResult, Error, SelectedInteractionsCount, InteractionsCountQueryKey> = {}
) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const resolvedFromAddress = (inputFromAddress || accountAddress)?.toLowerCase();
  const resolvedCurrency = inputCurrency || nativeCurrency;

  const queryKey = interactionsCountQueryKey({
    fromAddress: resolvedFromAddress as Address,
    toAddress,
    currency: resolvedCurrency,
  });

  return useQuery(queryKey, interactionsCountQueryFunction, {
    ...config,
    enabled: !!toAddress && !!resolvedFromAddress && (config.enabled ?? true),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
    // Select function processes the raw transaction list
    select: (transactions: InteractionsCountResult): SelectedInteractionsCount => {
      const totalCount = transactions.length;
      const specificChainCount = chainId !== undefined ? transactions.filter(tx => tx.chain_id === chainId).length : undefined;
      return { totalCount, specificChainCount };
    },
  });
}
