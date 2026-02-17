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

export const simulateTransactions = async (args: SimulateTransactionsQueryVariables) => {
  if (!args.transactions) return [];
  const response = await metadataPOSTClient.simulateTransactions(args);
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
