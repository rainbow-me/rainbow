import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ChainId } from '@/chains/types';
import { ClaimStatus, TokenToReceive } from '../types';
import { CrosschainQuote, ETH_ADDRESS, getCrosschainQuote, getQuote, Quote, QuoteParams } from '@rainbow-me/swaps';
import { Claimable } from '@/resources/addys/claimables/types';
import { logger, RainbowError } from '@/logger';
import { useAccountSettings } from '@/hooks';
import { convertAmountToRawAmount } from '@/helpers/utilities';

interface OutputConfig {
  token: TokenToReceive | undefined;
  chainId: ChainId | undefined;
}

type ClaimContextType = {
  outputConfig: OutputConfig;
  quote: Quote | CrosschainQuote | undefined;
  claimStatus: ClaimStatus;
  claimable: Claimable;

  setOutputConfig: Dispatch<SetStateAction<OutputConfig>>;
  setQuote: Dispatch<SetStateAction<Quote | CrosschainQuote | undefined>>;
  setClaimStatus: Dispatch<SetStateAction<ClaimStatus>>;
};

const ClaimContext = createContext<ClaimContextType | undefined>(undefined);

export function useClaimContext() {
  const context = useContext(ClaimContext);
  if (context === undefined) {
    throw new Error('useClaimContext must be used within a ClaimContextProvider');
  }
  return context;
}

export function ClaimContextProvider({ claimable, children }: { claimable: Claimable; children: React.ReactNode }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const [outputConfig, setOutputConfig] = useState<OutputConfig>({
    chainId: claimable.asset.chainId,
    token: {
      address: claimable.asset.address,
      iconUrl: claimable.asset.icon_url,
      name: claimable.asset.name,
      symbol: claimable.asset.symbol,
      networks: claimable.asset.networks,
      isNativeAsset: false,
    },
  });
  const [quote, setQuote] = useState<Quote | CrosschainQuote | undefined>(undefined);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('ready');

  const updateQuote = useCallback(
    async (outputToken: TokenToReceive, outputChainId: ChainId) => {
      console.log('update quote');
      console.log('updateQuote called with:', {
        outputChainId,
        willBeUsedAs_toChainId: outputChainId, // Same value at this point
      });
      const quoteParams: QuoteParams = {
        chainId: claimable.chainId,
        fromAddress: accountAddress,
        sellTokenAddress: claimable.asset.isNativeAsset ? ETH_ADDRESS : claimable.asset.address,
        buyTokenAddress: outputToken.isNativeAsset ? ETH_ADDRESS : outputToken.address,
        sellAmount: convertAmountToRawAmount(0.0001, claimable.asset.decimals),
        slippage: 0.5,
        refuel: false,
        toChainId: outputChainId,
        currency: nativeCurrency,
      };

      console.log('quoteParams created:', {
        receivedChainId: outputChainId,
        paramsToChainId: quoteParams.toChainId,
        entireParams: quoteParams,
      });

      const quote = claimable.chainId === outputChainId ? await getQuote(quoteParams) : await getCrosschainQuote(quoteParams);
      console.log('quote attempt');
      if (!quote || 'error' in quote) {
        if (quote?.message === 'no routes found') {
          console.log('NO ROUTE');
          setClaimStatus('noRoute');
        } else {
          setClaimStatus('noQuote');
          logger.error(new RainbowError('[ClaimingTransactionClaimable]: failed to get quote'), { quote, quoteParams });
        }
        setQuote(undefined);
      } else {
        console.log('setquote');
        setQuote(quote);
        setClaimStatus('ready');
      }
    },
    [accountAddress, claimable.asset.address, claimable.asset.decimals, claimable.asset.isNativeAsset, claimable.chainId, nativeCurrency]
  );
  console.log('HE');
  useEffect(() => {
    if (
      claimable.type === 'transaction' &&
      outputConfig.token &&
      outputConfig.chainId &&
      !(outputConfig.token.symbol === claimable.asset.symbol && outputConfig.chainId === claimable.asset.chainId)
    ) {
      console.log(outputConfig.token.symbol, claimable.asset.symbol, outputConfig.chainId, claimable.asset.chainId);
      setClaimStatus('fetchingQuote');
      updateQuote(outputConfig.token, outputConfig.chainId);
    }
  }, [claimable.asset.chainId, claimable.asset.symbol, claimable.type, outputConfig.chainId, outputConfig.token, updateQuote]);

  return (
    <ClaimContext.Provider
      value={{
        outputConfig,
        quote,
        claimStatus,
        claimable,

        setOutputConfig,
        setQuote,
        setClaimStatus,
      }}
    >
      {children}
    </ClaimContext.Provider>
  );
}
