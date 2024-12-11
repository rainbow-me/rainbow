import { createQueryKey, QueryConfig, QueryFunctionArgs } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { RainbowError, logger } from '@/logger';
import { metadataPOSTClient } from '@/graphql';
import { TransactionErrorType, TransactionScanResultType, TransactionSimulationResult } from '@/graphql/__generated__/metadataPOST';
import { isNil } from 'lodash';
import { RequestData } from '@/walletConnect/types';
import { ChainId } from '@/state/backendNetworks/types';

type SimulationArgs = {
  address: string;
  chainId: ChainId;
  isMessageRequest: boolean;
  nativeCurrency: string;
  req: any; // Replace 'any' with the correct type for 'req'
  requestMessage: string;
  simulationUnavailable: boolean;
  transactionDetails: RequestData;
};

type SimulationResult = {
  simulationData: TransactionSimulationResult | undefined;
  simulationError: TransactionErrorType | undefined;
  simulationScanResult: TransactionScanResultType | undefined;
};

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

const fetchSimulation = async ({
  queryKey: [{ address, chainId, isMessageRequest, nativeCurrency, req, requestMessage, simulationUnavailable, transactionDetails }],
}: QueryFunctionArgs<typeof simulationQueryKey>): Promise<SimulationResult> => {
  try {
    let simulationData;

    if (isMessageRequest) {
      simulationData = await metadataPOSTClient.simulateMessage({
        address,
        chainId,
        message: {
          method: transactionDetails?.payload?.method,
          params: [requestMessage],
        },
        domain: transactionDetails?.dappUrl,
      });

      if (isNil(simulationData?.simulateMessage?.simulation) && isNil(simulationData?.simulateMessage?.error)) {
        return {
          simulationData: { in: [], out: [], approvals: [] },
          simulationError: undefined,
          simulationScanResult: simulationData?.simulateMessage?.scanning?.result,
        };
      } else if (simulationData?.simulateMessage?.error && !simulationUnavailable) {
        return {
          simulationData: undefined,
          simulationError: simulationData?.simulateMessage?.error?.type,
          simulationScanResult: simulationData?.simulateMessage?.scanning?.result,
        };
      } else if (simulationData.simulateMessage?.simulation && !simulationUnavailable) {
        return {
          simulationData: simulationData.simulateMessage?.simulation,
          simulationError: undefined,
          simulationScanResult: simulationData?.simulateMessage?.scanning?.result,
        };
      }
    } else {
      simulationData = await metadataPOSTClient.simulateTransactions({
        chainId,
        currency: nativeCurrency?.toLowerCase(),
        transactions: [
          {
            from: req?.from,
            to: req?.to,
            data: req?.data || '0x',
            value: req?.value || '0x0',
          },
        ],
        domain: transactionDetails?.dappUrl,
      });

      if (isNil(simulationData?.simulateTransactions?.[0]?.simulation) && isNil(simulationData?.simulateTransactions?.[0]?.error)) {
        return {
          simulationData: { in: [], out: [], approvals: [] },
          simulationError: undefined,
          simulationScanResult: simulationData?.simulateTransactions?.[0]?.scanning?.result,
        };
      } else if (simulationData?.simulateTransactions?.[0]?.error) {
        return {
          simulationData: undefined,
          simulationError: simulationData?.simulateTransactions?.[0]?.error?.type,
          simulationScanResult: simulationData?.simulateTransactions[0]?.scanning?.result,
        };
      } else if (simulationData.simulateTransactions?.[0]?.simulation) {
        return {
          simulationData: simulationData.simulateTransactions[0]?.simulation,
          simulationError: undefined,
          simulationScanResult: simulationData?.simulateTransactions[0]?.scanning?.result,
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
