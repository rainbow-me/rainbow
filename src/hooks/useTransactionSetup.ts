import * as i18n from '@/languages';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import useGas from '@/hooks/useGas';
import { methodRegistryLookupAndParse } from '@/utils/methodRegistry';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { ChainId } from '@/state/backendNetworks/types';

type TransactionSetupParams = {
  chainId: ChainId;
  startPollingGasFees: ReturnType<typeof useGas>['startPollingGasFees'];
  stopPollingGasFees: ReturnType<typeof useGas>['stopPollingGasFees'];
  isMessageRequest: boolean;
  transactionDetails: any;
  source: RequestSource;
};

export const useTransactionSetup = ({
  chainId,
  startPollingGasFees,
  stopPollingGasFees,
  isMessageRequest,
  transactionDetails,
  source,
}: TransactionSetupParams) => {
  const [methodName, setMethodName] = useState<string | null>(null);

  const fetchMethodName = useCallback(
    async (data: string) => {
      const methodSignaturePrefix = data.substr(0, 10);
      try {
        const { name } = await methodRegistryLookupAndParse(methodSignaturePrefix, chainId);
        if (name) {
          setMethodName(name);
        }
      } catch (e) {
        setMethodName(data);
      }
    },
    [chainId]
  );

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (chainId) {
        if (!isMessageRequest) {
          startPollingGasFees(chainId);
          fetchMethodName(transactionDetails?.payload?.params?.[0].data);
        } else {
          setMethodName(i18n.t(i18n.l.wallet.message_signing.request));
        }
        analytics.track(event.txRequestShownSheet, { source });
      }
    });

    return () => {
      if (!isMessageRequest) {
        stopPollingGasFees();
      }
    };
  }, [isMessageRequest, chainId, transactionDetails?.payload?.params, source, fetchMethodName, startPollingGasFees, stopPollingGasFees]);

  return { methodName };
};
