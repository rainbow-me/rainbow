import { Box, Text, useColorMode } from '@/design-system';
import { haptics } from '@/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ETH_SYMBOL, USDC_ADDRESS } from '@/references';
import { ClaimableMenu } from '../../shared/components/ClaimableMenu';
import { TokenToReceive } from '../types';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import { searchVerifiedTokens, TokenLists } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { SearchAsset } from '@/__swaps__/types/search';
import i18n from '@/languages';
import { IS_ANDROID } from '@/env';
import { MenuItem } from '@/components/DropdownMenu';
import { NetworkSelectorButton } from '@/components/buttons/NetworkSelectorButton';
import { ChainId } from '@/state/backendNetworks/types';

type TokenMap = Record<TokenToReceive['symbol'], TokenToReceive>;

export function ClaimCustomization() {
  const { isDarkMode } = useColorMode();

  const balanceSortedChainList = useUserAssetsStore(state => state.getBalanceSortedChainList());
  const {
    claimStatus,
    claimable: { asset: claimableAsset },
    outputConfig: { chainId: outputChainId, token: outputToken },
    setOutputConfig,
    setQuoteState,
    setGasState,
  } = useTransactionClaimableContext();

  const [isInitialState, setIsInitialState] = useState(true);
  const [usdc, setUsdc] = useState<SearchAsset | null>(null);

  useEffect(() => {
    const fetchUsdcAsset = async () => {
      const searchResults = await searchVerifiedTokens({ query: USDC_ADDRESS, chainId: ChainId.mainnet, list: TokenLists.Verified }, null);

      const possibleResults = searchResults.results;
      const usdc = possibleResults.find(asset => asset?.address === USDC_ADDRESS && asset?.symbol === 'USDC');
      if (usdc) {
        setUsdc(usdc);
      }
    };
    fetchUsdcAsset();
  }, []);

  // populate `networks` attribute for native tokens
  const nativeTokens: TokenMap = useMemo(
    () =>
      balanceSortedChainList.reduce<TokenMap>((nativeTokenDict, chainId) => {
        const nativeToken = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
        if (nativeToken) {
          if (!nativeTokenDict[nativeToken.symbol]) {
            nativeTokenDict[nativeToken.symbol] = {
              mainnetAddress: nativeToken.address,
              iconUrl: nativeToken.iconURL,
              name: nativeToken.name,
              symbol: nativeToken.symbol,
              networks: {},
              decimals: nativeToken.decimals,
              isNativeAsset: true,
            };
          }
          nativeTokenDict[nativeToken.symbol].networks[chainId] = { address: nativeToken.address };
        }
        return nativeTokenDict;
      }, {}),
    [balanceSortedChainList]
  );

  const tokens: TokenMap = useMemo(
    () => ({
      ...nativeTokens,
      [claimableAsset.symbol]: {
        mainnetAddress: claimableAsset.address,
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        decimals: claimableAsset.decimals,
        isNativeAsset: !!claimableAsset.isNativeAsset,
      },
      ...(usdc && {
        [usdc.symbol]: {
          mainnetAddress: usdc.address,
          iconUrl: usdc.icon_url,
          name: usdc.name,
          symbol: usdc.symbol,
          networks: usdc.networks,
          decimals: usdc.decimals,
          isNativeAsset: false,
        },
      }),
    }),
    [claimableAsset, nativeTokens, usdc]
  );

  const resetState = useCallback(() => {
    setOutputConfig({
      token: {
        mainnetAddress: claimableAsset.address,
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        decimals: claimableAsset.decimals,
        isNativeAsset: !!claimableAsset.isNativeAsset,
      },
      chainId: claimableAsset.chainId,
    });
    setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
    setGasState({ gasLimit: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
    setIsInitialState(true);
  }, [
    setOutputConfig,
    claimableAsset.address,
    claimableAsset.icon_url,
    claimableAsset.name,
    claimableAsset.symbol,
    claimableAsset.networks,
    claimableAsset.decimals,
    claimableAsset.isNativeAsset,
    claimableAsset.chainId,
    setQuoteState,
    setGasState,
  ]);

  const tokenMenuConfig = useMemo(() => {
    let availableTokens: MenuItem<string>[] = [];
    availableTokens = Object.values(tokens)
      .filter(token => {
        // exclude if token is already selected
        if (token.symbol === outputToken?.symbol) {
          return false;
        }

        // if token is ETH, include if ANY are true:
        // 1. ETH is not marked as native asset (this means it's the claimable asset)
        // 2. it's the initial state
        // 2. there's no selected chain
        // 3. the selected chain supports ETH
        if (token.symbol === ETH_SYMBOL) {
          return !token.isNativeAsset || isInitialState || !outputChainId || outputChainId in token.networks;
        }

        // if token is a native asset, include if BOTH are true:
        // 1. there's a selected chain
        // 2. the selected chain supports the native asset
        if (token.isNativeAsset) {
          return outputChainId && outputChainId in token.networks;
        }

        // otherwise (non-native, non-selected token), include if ANY are true:
        // 1. it's the initial state
        // 2. there's no selected chain
        // 3. the selected chain supports the token
        return isInitialState || !outputChainId || outputChainId in token.networks;
      })
      .map(token => ({
        actionKey: token.symbol,
        actionTitle: token.name,
        icon: {
          iconType: 'REMOTE',
          iconValue: {
            uri: token.iconUrl,
          },
        },
      }));

    availableTokens = availableTokens.sort((a, b) => (a.actionTitle < b.actionTitle ? 1 : -1));

    availableTokens = [
      {
        actionKey: 'reset',
        actionTitle: 'Reset',
        icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' },
      },
      ...availableTokens,
    ];

    if (IS_ANDROID) {
      availableTokens = availableTokens.reverse();
    }

    return {
      menuItems: availableTokens,
    };
  }, [tokens, outputToken?.symbol, isInitialState, outputChainId]);

  const handleTokenSelection = useCallback(
    (actionKey: string) => {
      haptics.selection();
      if (actionKey === 'reset') {
        resetState();
      } else {
        const newToken = tokens[actionKey];
        setOutputConfig(prev => {
          const newChainId = prev.chainId && prev.chainId in newToken.networks ? prev.chainId : undefined;
          return {
            chainId: newChainId,
            token: newToken,
          };
        });
        setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
        setGasState({ gasLimit: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
        setIsInitialState(false);
      }
    },
    [resetState, setOutputConfig, setQuoteState, setGasState, tokens]
  );

  const handleNetworkSelection = useCallback(
    (chainId: ChainId | undefined) => {
      if (chainId === undefined) return; // this will never happen, but it's here to satisfy the type checker

      setOutputConfig(prev => {
        const newToken = prev.token && chainId in prev.token.networks ? prev.token : undefined;
        return {
          token: newToken,
          chainId,
        };
      });
      setGasState({ gasLimit: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
      setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
      setIsInitialState(false);
    },
    [setOutputConfig, setQuoteState, setGasState]
  );

  const isDisabled =
    claimStatus === 'success' || claimStatus === 'pending' || claimStatus === 'claiming' || claimStatus === 'unrecoverableError';

  return (
    <Box justifyContent="center" alignItems="center" flexDirection="row" gap={5}>
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        {i18n.claimables.panel.receive()}
      </Text>
      <ClaimableMenu
        disabled={isDisabled}
        menuConfig={tokenMenuConfig}
        onPressMenuItem={handleTokenSelection}
        text={outputToken?.symbol ?? i18n.claimables.panel.a_token()}
        muted={isInitialState}
      />
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        {i18n.claimables.panel.on()}
      </Text>

      <Box
        paddingHorizontal={{ custom: 7 }}
        height={{ custom: 28 }}
        flexDirection="row"
        borderColor={{ custom: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.02)' }}
        borderWidth={1.33}
        borderRadius={12}
        gap={4}
        style={{ backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.02)' }}
        alignItems="center"
        justifyContent="center"
      >
        <NetworkSelectorButton
          bleed={false}
          disabled={isDisabled}
          onSelectChain={handleNetworkSelection}
          selectedChainId={outputChainId}
          goBackOnSelect
          canEdit={false}
          allowedNetworks={balanceSortedChainList.filter(
            chainId => isInitialState || (chainId !== outputChainId && (!outputToken || chainId in outputToken.networks))
          )}
          actionButton={{
            icon: '􀅉',
            label: i18n.claimables.panel.reset(),
            color: 'labelTertiary',
            onPress: resetState,
          }}
        />
      </Box>
    </Box>
  );
}
