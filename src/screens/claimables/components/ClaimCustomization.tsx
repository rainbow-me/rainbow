import { Box, Text } from '@/design-system';
import { haptics } from '@/utils';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { chainsLabel, chainsName, chainsNativeAsset } from '@/chains';
import { ParsedAddressAsset } from '@/entities';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { DAI_ADDRESS, ETH_SYMBOL, WBTC_ADDRESS } from '@/references';
import { DropdownMenu } from './DropdownMenu';
import { TokenToReceive } from '../types';
import { useClaimContext } from './ClaimContext';

type TokenMap = Record<TokenToReceive['symbol'], TokenToReceive>;

export function ClaimCustomization({ claimableAsset }: { claimableAsset: ParsedAddressAsset }) {
  const { nativeCurrency } = useAccountSettings();
  const balanceSortedChainList = useUserAssetsStore(state => state.getBalanceSortedChainList());
  const {
    outputConfig: { chainId: outputChainId, token: outputToken },
    setOutputConfig,
    setQuote,
  } = useClaimContext();

  const [isInitialState, setIsInitialState] = useState(true);

  const { data: dai } = useExternalToken({
    address: DAI_ADDRESS,
    chainId: ChainId.mainnet,
    currency: nativeCurrency,
  });
  const { data: wbtc } = useExternalToken({
    address: WBTC_ADDRESS,
    chainId: ChainId.mainnet,
    currency: nativeCurrency,
  });

  const nativeTokens: TokenMap = useMemo(
    () =>
      balanceSortedChainList.reduce<TokenMap>((nativeTokenDict, chainId) => {
        const nativeToken = chainsNativeAsset[chainId];
        if (nativeToken) {
          if (!nativeTokenDict[nativeToken.symbol]) {
            nativeTokenDict[nativeToken.symbol] = {
              address: nativeToken.address,
              iconUrl: nativeToken.iconURL,
              name: nativeToken.name,
              symbol: nativeToken.symbol,
              networks: {},
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
        address: claimableAsset.address,
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        isNativeAsset: false,
      },
      ...(dai && {
        [dai.symbol]: {
          address: dai.address,
          iconUrl: dai.icon_url,
          name: dai.name,
          symbol: dai.symbol,
          networks: dai.networks,
          isNativeAsset: false,
        },
      }),
      ...(wbtc && {
        [wbtc.symbol]: {
          address: wbtc.address,
          iconUrl: wbtc.icon_url,
          name: wbtc.name,
          symbol: wbtc.symbol,
          networks: wbtc.networks,
          isNativeAsset: false,
        },
      }),
    }),
    [claimableAsset, dai, nativeTokens, wbtc]
  );

  const resetState = useCallback(() => {
    setOutputConfig({
      token: {
        address: claimableAsset.address,
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        isNativeAsset: false,
      },
      chainId: claimableAsset.chainId,
    });
    setQuote(undefined);
    setIsInitialState(true);
  }, [
    setOutputConfig,
    claimableAsset.address,
    claimableAsset.icon_url,
    claimableAsset.name,
    claimableAsset.symbol,
    claimableAsset.networks,
    claimableAsset.chainId,
    setQuote,
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
      .filter(chainId => chainId !== outputChainId)
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
  }, [balanceSortedChainList, outputChainId]);

  const handleTokenSelection = useCallback(
    (selection: keyof typeof tokens | 'reset') => {
      haptics.selection();
      if (selection === 'reset') {
        resetState();
      } else {
        const newToken = tokens[selection];
        setOutputConfig(prev => {
          const currentChainId = prev.chainId;
          const newChainId = currentChainId && !(currentChainId in tokens[selection].networks) ? undefined : currentChainId;

          return {
            ...prev,
            chainId: newChainId,
            token: newToken,
          };
        });
        setQuote(undefined);
        setIsInitialState(false);
      }
    },
    [resetState, setOutputConfig, setQuote, tokens]
  );

  const handleNetworkSelection = useCallback(
    (selection: `${ChainId}` | 'reset') => {
      haptics.selection();
      if (selection === 'reset') {
        resetState();
      } else {
        const newChainId = +selection;
        setOutputConfig(prev => {
          const currentToken = prev.token;
          const newToken =
            currentToken && (!tokens[currentToken.symbol] || !(newChainId in tokens[currentToken.symbol].networks))
              ? undefined
              : currentToken;

          return {
            chainId: newChainId,
            token: newToken,
          };
        });
        setQuote(undefined);
        setIsInitialState(false);
      }
    },
    [resetState, setOutputConfig, setQuote, tokens]
  );

  return (
    <Box justifyContent="center" alignItems="center" flexDirection="row" gap={5}>
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        Receive
      </Text>
      <DropdownMenu
        menuConfig={tokenMenuConfig}
        onPressMenuItem={handleTokenSelection}
        text={outputToken?.symbol ?? 'a token'}
        muted={isInitialState}
      />
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        on
      </Text>
      <DropdownMenu
        menuConfig={networkMenuConfig}
        onPressMenuItem={handleNetworkSelection}
        text={outputChainId ? chainsLabel[outputChainId] : 'a network'}
        muted={isInitialState}
      />
    </Box>
  );
}
