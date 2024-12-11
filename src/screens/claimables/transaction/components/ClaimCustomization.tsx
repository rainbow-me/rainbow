import { Box, Text } from '@/design-system';
import { haptics, showActionSheetWithOptions } from '@/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { chainsLabel, chainsName, chainsNativeAsset } from '@/chains';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ETH_SYMBOL, USDC_ADDRESS } from '@/references';
import { DropdownMenu } from '../../shared/components/DropdownMenu';
import { TokenToReceive } from '../types';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import { useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { SearchAsset } from '@/__swaps__/types/search';
import * as i18n from '@/languages';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { IS_ANDROID } from '@/env';

type TokenMap = Record<TokenToReceive['symbol'], TokenToReceive>;

export function ClaimCustomization() {
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

  const { data: usdcSearchData } = useTokenSearch(
    {
      keys: ['address'],
      list: 'verifiedAssets',
      threshold: 'CASE_SENSITIVE_EQUAL',
      query: USDC_ADDRESS,
    },
    {
      select: data => {
        return data.filter((asset: SearchAsset) => asset.address === USDC_ADDRESS && asset.symbol === 'USDC');
      },
    }
  );

  const usdc = usdcSearchData?.[0];

  // populate `networks` attribute for native tokens
  const nativeTokens: TokenMap = useMemo(
    () =>
      balanceSortedChainList.reduce<TokenMap>((nativeTokenDict, chainId) => {
        const nativeToken = chainsNativeAsset[chainId];
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
    const availableTokens = Object.values(tokens)
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
      }))
      .sort((a, b) => (a.actionTitle < b.actionTitle ? 1 : -1));

    let menuItems = [
      {
        actionKey: 'reset',
        actionTitle: 'Reset',
        icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' },
      },
      ...availableTokens,
    ];

    if (IS_ANDROID) {
      menuItems = menuItems.reverse();
    }

    return {
      menuItems,
    };
  }, [tokens, outputToken?.symbol, isInitialState, outputChainId]);

  const networkMenuConfig = useMemo(() => {
    const supportedChains = balanceSortedChainList
      .filter(chainId => isInitialState || (chainId !== outputChainId && (!outputToken || chainId in outputToken.networks)))
      .map(chainId => ({
        actionKey: `${chainId}`,
        actionTitle: chainsLabel[chainId],
        icon: {
          iconType: 'ASSET',
          iconValue: chainId === ChainId.mainnet ? 'ethereumBadge' : `${chainsName[chainId]}BadgeNoShadow`,
        },
      }))
      .reverse();

    let menuItems = [
      {
        actionKey: 'reset',
        actionTitle: 'Reset',
        icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' },
      },
      ...supportedChains,
    ];

    if (IS_ANDROID) {
      menuItems = menuItems.reverse();
    }

    return {
      menuItems,
    };
  }, [balanceSortedChainList, isInitialState, outputChainId, outputToken]);

  const handleTokenSelection = useCallback(
    ({ nativeEvent: { actionKey } }: Omit<OnPressMenuItemEventObject, 'isUsingActionSheetFallback'>) => {
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
    ({ nativeEvent: { actionKey } }: Omit<OnPressMenuItemEventObject, 'isUsingActionSheetFallback'>) => {
      haptics.selection();
      if (actionKey === 'reset') {
        resetState();
      } else {
        const newChainId = +actionKey;
        setOutputConfig(prev => {
          const newToken = prev.token && newChainId in prev.token.networks ? prev.token : undefined;
          return {
            token: newToken,
            chainId: newChainId,
          };
        });
        setGasState({ gasLimit: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
        setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
        setIsInitialState(false);
      }
    },
    [resetState, setOutputConfig, setQuoteState, setGasState]
  );

  const onShowTokenActionSheet = useCallback(() => {
    const tokenTitles = tokenMenuConfig.menuItems.map(token => token.actionTitle);

    showActionSheetWithOptions(
      {
        options: tokenTitles,
        showSeparators: true,
      },
      (index: number | undefined) => {
        // NOTE: When they click away from the menu, the index is undefined
        if (typeof index === 'undefined') return;
        handleTokenSelection({
          nativeEvent: { actionKey: tokenMenuConfig.menuItems[index].actionKey, actionTitle: '' },
        });
      }
    );
  }, [handleTokenSelection, tokenMenuConfig.menuItems]);

  const onShowNetworkActionSheet = useCallback(() => {
    const networkTitles = networkMenuConfig.menuItems.map(network => network.actionTitle);

    showActionSheetWithOptions(
      {
        options: networkTitles,
        showSeparators: true,
      },
      (index: number | undefined) => {
        // NOTE: When they click away from the menu, the index is undefined
        if (typeof index === 'undefined') return;
        handleNetworkSelection({
          nativeEvent: { actionKey: networkMenuConfig.menuItems[index].actionKey, actionTitle: '' },
        });
      }
    );
  }, [handleNetworkSelection, networkMenuConfig.menuItems]);

  const isDisabled =
    claimStatus === 'success' || claimStatus === 'pending' || claimStatus === 'claiming' || claimStatus === 'unrecoverableError';

  return (
    <Box justifyContent="center" alignItems="center" flexDirection="row" gap={5}>
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        {i18n.t(i18n.l.claimables.panel.receive)}
      </Text>
      <DropdownMenu
        disabled={isDisabled}
        menuConfig={tokenMenuConfig}
        onPressMenuItem={handleTokenSelection}
        onShowActionSheet={onShowTokenActionSheet}
        text={outputToken?.symbol ?? i18n.t(i18n.l.claimables.panel.a_token)}
        muted={isInitialState}
      />
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        {i18n.t(i18n.l.claimables.panel.on)}
      </Text>
      <DropdownMenu
        disabled={isDisabled}
        menuConfig={networkMenuConfig}
        onPressMenuItem={handleNetworkSelection}
        onShowActionSheet={onShowNetworkActionSheet}
        text={outputChainId ? chainsLabel[outputChainId] : i18n.t(i18n.l.claimables.panel.a_network)}
        muted={isInitialState}
        icon={<ChainImage chainId={outputChainId} size={16} />}
      />
    </Box>
  );
}
