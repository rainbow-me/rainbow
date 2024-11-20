import { Box, Text } from '@/design-system';
import { haptics } from '@/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { chainsLabel, chainsName, chainsNativeAsset } from '@/chains';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { DAI_ADDRESS, ETH_SYMBOL, WBTC_ADDRESS } from '@/references';
import { DropdownMenu } from '../../shared/components/DropdownMenu';
import { TokenToReceive } from '../types';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import { useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { SearchAsset } from '@/__swaps__/types/search';
import * as i18n from '@/languages';

type TokenMap = Record<TokenToReceive['symbol'], TokenToReceive>;

export function ClaimCustomization() {
  const balanceSortedChainList = useUserAssetsStore(state => state.getBalanceSortedChainList());
  const {
    claimStatus,
    claimable: { asset: claimableAsset },
    outputConfig: { chainId: outputChainId, token: outputToken },
    setOutputConfig,
    setQuoteState,
    setTxState,
  } = useTransactionClaimableContext();

  const [isInitialState, setIsInitialState] = useState(true);

  const { data: daiSearchData } = useTokenSearch(
    {
      keys: ['address'],
      list: 'verifiedAssets',
      threshold: 'CASE_SENSITIVE_EQUAL',
      query: DAI_ADDRESS,
    },
    {
      select: data => {
        return data.filter((asset: SearchAsset) => asset.address === DAI_ADDRESS && asset.symbol === 'DAI');
      },
    }
  );

  const dai = daiSearchData?.[0];

  const { data: wbtcSearchData } = useTokenSearch(
    {
      keys: ['address'],
      list: 'verifiedAssets',
      threshold: 'CASE_SENSITIVE_EQUAL',
      query: WBTC_ADDRESS,
    },
    {
      select: data => {
        return data.filter((asset: SearchAsset) => asset.address === WBTC_ADDRESS && asset.symbol === 'WBTC');
      },
    }
  );

  const wbtc = wbtcSearchData?.[0];

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
              isNativeAsset: true,
              isDefaultAsset: false,
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
        isNativeAsset: !!claimableAsset.isNativeAsset,
        isDefaultAsset: true,
      },
      ...(dai && {
        [dai.symbol]: {
          mainnetAddress: dai.address,
          iconUrl: dai.icon_url,
          name: dai.name,
          symbol: dai.symbol,
          networks: dai.networks,
          isNativeAsset: false,
          isDefaultAsset: false,
        },
      }),
      ...(wbtc && {
        [wbtc.symbol]: {
          mainnetAddress: wbtc.address,
          iconUrl: wbtc.icon_url,
          name: wbtc.name,
          symbol: wbtc.symbol,
          networks: wbtc.networks,
          isNativeAsset: false,
          isDefaultAsset: false,
        },
      }),
    }),
    [claimableAsset, dai, nativeTokens, wbtc]
  );

  const resetState = useCallback(() => {
    setOutputConfig({
      token: {
        mainnetAddress: claimableAsset.address,
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        isNativeAsset: !!claimableAsset.isNativeAsset,
        isDefaultAsset: true,
      },
      chainId: claimableAsset.chainId,
    });
    setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
    setTxState({ txPayload: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
    setIsInitialState(true);
  }, [
    setOutputConfig,
    claimableAsset.address,
    claimableAsset.icon_url,
    claimableAsset.name,
    claimableAsset.symbol,
    claimableAsset.networks,
    claimableAsset.isNativeAsset,
    claimableAsset.chainId,
    setQuoteState,
    setTxState,
  ]);

  const tokenMenuConfig = useMemo(() => {
    const availableTokens = Object.values(tokens)
      .filter(token => {
        // exclude if token is already selected
        if (token.symbol === outputToken?.symbol) {
          return false;
        }

        if (token.isDefaultAsset) {
          return true;
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

    return {
      menuItems: [
        {
          actionKey: 'reset',
          actionTitle: 'Reset',
          icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' },
        },
        ...availableTokens,
      ],
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
      }));

    return {
      menuItems: [
        {
          actionKey: 'reset',
          actionTitle: 'Reset',
          icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' },
        },
        ...supportedChains,
      ],
    };
  }, [balanceSortedChainList, isInitialState, outputChainId, outputToken]);

  const handleTokenSelection = useCallback(
    (selection: keyof typeof tokens | 'reset') => {
      haptics.selection();
      if (selection === 'reset') {
        resetState();
      } else {
        const newToken = tokens[selection];
        setOutputConfig(prev => {
          const newChainId = prev.chainId && prev.chainId in newToken.networks ? prev.chainId : undefined;
          return {
            chainId: newChainId,
            token: newToken,
          };
        });
        setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
        setTxState({ txPayload: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
        setIsInitialState(false);
      }
    },
    [resetState, setOutputConfig, setQuoteState, setTxState, tokens]
  );

  const handleNetworkSelection = useCallback(
    (selection: `${ChainId}` | 'reset') => {
      haptics.selection();
      if (selection === 'reset') {
        resetState();
      } else {
        const newChainId = +selection;
        setOutputConfig(prev => {
          const newToken = prev.token && newChainId in prev.token.networks ? prev.token : undefined;
          return {
            token: newToken,
            chainId: newChainId,
          };
        });
        setTxState({ txPayload: undefined, isSufficientGas: false, gasFeeDisplay: undefined, status: 'none' });
        setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'none' });
        setIsInitialState(false);
      }
    },
    [resetState, setOutputConfig, setQuoteState, setTxState]
  );

  const isDisabled =
    claimStatus === 'success' || claimStatus === 'pending' || claimStatus === 'claiming' || claimStatus === 'unrecoverableError';

  return (
    <Box justifyContent="center" alignItems="center" flexDirection="row" gap={5}>
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        Receive
      </Text>
      <DropdownMenu
        disabled={isDisabled}
        menuConfig={tokenMenuConfig}
        onPressMenuItem={handleTokenSelection}
        text={outputToken?.symbol ?? i18n.t(i18n.l.claimables.panel.a_token)}
        muted={isInitialState}
      />
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        on
      </Text>
      <DropdownMenu
        disabled={isDisabled}
        menuConfig={networkMenuConfig}
        onPressMenuItem={handleNetworkSelection}
        text={outputChainId ? chainsLabel[outputChainId] : i18n.t(i18n.l.claimables.panel.a_network)}
        muted={isInitialState}
      />
    </Box>
  );
}
