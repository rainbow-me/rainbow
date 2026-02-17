import type { Address } from 'viem';
import { prepareBatchedTransaction, supportsDelegation, type BatchCall } from '@rainbow-me/delegation';
import { DELEGATION, getExperimentalFlag } from '@/config/experimental';
import { getRemoteConfig } from '@/model/remoteConfig';
import { createQueryKey, QueryConfig, QueryFunctionArgs } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { RainbowError, logger } from '@/logger';
import { metadataPOSTClient } from '@/graphql';
import {
  MessageResult,
  SimulateMessageQueryVariables,
  SimulateTransactionsQueryVariables,
  Transaction,
  TransactionErrorType,
  TransactionResult,
  TransactionScanResultType,
  TransactionSimulationResult,
} from '@/graphql/__generated__/metadataPOST';
import { isNil } from 'lodash';
import { RequestData } from '@/walletConnect/types';
import { ChainId } from '@/state/backendNetworks/types';
import { getNextNonce } from '@/state/nonces';

// ///////////////////////////////////////////////
// Types

type SimulationArgs = {
  address: string;
  chainId: ChainId;
  isMessageRequest: boolean;
  nativeCurrency: string;
  req: Transaction;
  requestMessage: string;
  simulationUnavailable: boolean;
  transactionDetails: RequestData;
};

type SimulationResult = {
  simulationData: TransactionSimulationResult | undefined;
  simulationError: TransactionErrorType | undefined;
  simulationScanResult: TransactionScanResultType | undefined;
};

// ///////////////////////////////////////////////
// Simulations

const prepareSimulationTransaction = async ({
  from,
  chainId,
  transactions,
}: {
  from: Address;
  chainId: number;
  transactions: Transaction[];
}) => {
  const delegationEnabled = getRemoteConfig().delegation_enabled || getExperimentalFlag(DELEGATION);
  if (!delegationEnabled) return transactions;

  const { supported } = await supportsDelegation({ address: from, chainId });
  if (!supported) return transactions;

  const nonce = await getNextNonce({ address: from, chainId });

  // Converts transaction representation to delegation formats if applicable
  // Casting is safe as we are casting string to Hex string type
  return prepareBatchedTransaction({ from, chainId, calls: transactions as BatchCall[], nonce });
};

export const simulateTransactions = async (args: SimulateTransactionsQueryVariables) => {
  if (!args.transactions) return [];

  const transactions = Array.isArray(args.transactions) ? args.transactions : [args.transactions];
  if (transactions.length === 0) return [];

  const preparedTransaction = await prepareSimulationTransaction({
    from: transactions[0].from as Address,
    chainId: args.chainId,
    transactions,
  });

  const response = await metadataPOSTClient.simulateTransactions({ ...args, transactions: preparedTransaction });
  return response?.simulateTransactions ?? [];
};

export const simulateTransaction = async (args: SimulateTransactionsQueryVariables): Promise<Partial<TransactionResult>> => {
  const [result] = await simulateTransactions(args);
  return result ?? {};
};

export const simulateMessage = async (args: SimulateMessageQueryVariables): Promise<Partial<MessageResult>> => {
  const response = await metadataPOSTClient.simulateMessage(args);
  return response?.simulateMessage ?? {};
};

// ///////////////////////////////////////////////
// Query Key

const simulationQueryKey = ({
  address,
  chainId,
  isMessageRequest,
  nativeCurrency,
  req,
  requestMessage,
  simulationUnavailable,
  transactionDetails,
}: SimulationArgs) =>
  createQueryKey(
    'txSimulation',
    {
      address,
      chainId,
      isMessageRequest,
      nativeCurrency,
      req,
      requestMessage,
      simulationUnavailable,
      transactionDetails,
    },
    { persisterVersion: 1 }
  );

// ///////////////////////////////////////////////
// Query Function

const fetchSimulation = async ({
  queryKey: [{ address, chainId, isMessageRequest, nativeCurrency, req, requestMessage, simulationUnavailable, transactionDetails }],
}: QueryFunctionArgs<typeof simulationQueryKey>): Promise<SimulationResult> => {
  try {
    if (isMessageRequest) {
      const { simulation, error, scanning } = await simulateMessage({
        address,
        chainId,
        message: {
          method: transactionDetails?.payload?.method,
          params: [requestMessage],
        },
        domain: transactionDetails?.dappUrl,
      });

      if (isNil(simulation) && isNil(error)) {
        return {
          simulationData: { in: [], out: [], approvals: [] },
          simulationError: undefined,
          simulationScanResult: scanning?.result,
        };
      } else if (error && !simulationUnavailable) {
        return {
          simulationData: undefined,
          simulationError: error?.type,
          simulationScanResult: scanning?.result,
        };
      } else if (simulation && !simulationUnavailable) {
        return {
          simulationData: simulation,
          simulationError: undefined,
          simulationScanResult: scanning?.result,
        };
      }
    } else {
      const { simulation, error, scanning } = await simulateTransaction({
        chainId,
        currency: nativeCurrency?.toLowerCase(),
        transactions: {
          from: req.from,
          to: req.to,
          data: req.data || '0x',
          value: req.value || '0x0',
        },
        domain: transactionDetails?.dappUrl,
      });

      if (isNil(simulation) && isNil(error)) {
        return {
          simulationData: { in: [], out: [], approvals: [] },
          simulationError: undefined,
          simulationScanResult: scanning?.result,
        };
      } else if (error) {
        return {
          simulationData: undefined,
          simulationError: error?.type,
          simulationScanResult: scanning?.result,
        };
      } else if (simulation) {
        return {
          simulationData: simulation,
          simulationError: undefined,
          simulationScanResult: scanning?.result,
        };
      }
    }

    return {
      simulationData: undefined,
      simulationError: undefined,
      simulationScanResult: undefined,
    };
  } catch (error) {
    logger.error(new RainbowError('Error while simulating'), { error });
    throw error;
  }
};

// ///////////////////////////////////////////////
// Query Hook

export const useSimulation = (
  args: SimulationArgs,
  config: QueryConfig<SimulationResult, Error, ReturnType<typeof simulationQueryKey>> = {}
) => {
  return useQuery(simulationQueryKey(args), fetchSimulation, {
    enabled: !!args.address && !!args.chainId,
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    ...config,
  });
};
