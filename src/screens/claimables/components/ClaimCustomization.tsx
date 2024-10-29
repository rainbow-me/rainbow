import { Box, Text } from '@/design-system';
import { haptics } from '@/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { chainsLabel, chainsName, chainsNativeAsset } from '@/chains';
import { ParsedAddressAsset } from '@/entities';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { DAI_ADDRESS, ETH_SYMBOL, WBTC_ADDRESS } from '@/references';
import { DropdownMenu } from './DropdownMenu';
import { TokenToReceive } from '../types';

type TokenMap = Record<TokenToReceive['symbol'], TokenToReceive>;

// Types
interface DropdownState {
  selectedToken: TokenToReceive | undefined;
  selectedChain: ChainId | undefined;
  isInitialState: boolean;
}

export function ClaimCustomization({
  claimableAsset,
  setToken,
  setChainId,
}: {
  claimableAsset: ParsedAddressAsset;
  setToken: React.Dispatch<React.SetStateAction<TokenToReceive | undefined>>;
  setChainId: React.Dispatch<React.SetStateAction<ChainId | undefined>>;
}) {
  const { nativeCurrency } = useAccountSettings();
  const balanceSortedChainList = useUserAssetsStore(state => state.getBalanceSortedChainList());

  const [state, setState] = useState<DropdownState>({
    selectedToken: {
      address: claimableAsset.address,
      iconUrl: claimableAsset.icon_url,
      name: claimableAsset.name,
      symbol: claimableAsset.symbol,
      networks: claimableAsset.networks,
      isNativeAsset: false,
    },
    selectedChain: claimableAsset.chainId,
    isInitialState: true,
  });

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
    setState({
      selectedToken: {
        address: claimableAsset.address,
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        isNativeAsset: false,
      },
      selectedChain: claimableAsset.chainId,
      isInitialState: true,
    });
  }, [
    claimableAsset.address,
    claimableAsset.icon_url,
    claimableAsset.name,
    claimableAsset.symbol,
    claimableAsset.networks,
    claimableAsset.chainId,
  ]);

  const tokenMenuConfig = useMemo(() => {
    const availableTokens = Object.values(tokens)
      .filter(token => {
        // exclude if token is already selected
        if (token.symbol === state.selectedToken?.symbol) {
          return false;
        }

        // if token is ETH, include if ANY are true:
        // 1. ETH is not marked as native asset (this means it's the claimable asset)
        // 2. it's the initial state
        // 2. there's no selected chain
        // 3. the selected chain supports ETH
        if (token.symbol === ETH_SYMBOL) {
          return !token.isNativeAsset || state.isInitialState || !state.selectedChain || state.selectedChain in token.networks;
        }

        // if token is a native asset, include if BOTH are true:
        // 1. there's a selected chain
        // 2. the selected chain supports the native asset
        if (token.isNativeAsset) {
          return state.selectedChain && state.selectedChain in token.networks;
        }

        // otherwise (non-native, non-selected token), include if ANY are true:
        // 1. it's the initial state
        // 2. there's no selected chain
        // 3. the selected chain supports the token
        return state.isInitialState || !state.selectedChain || state.selectedChain in token.networks;
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
  }, [tokens, state.selectedChain, state.selectedToken, state.isInitialState]);

  const networkMenuConfig = useMemo(() => {
    const supportedChains = balanceSortedChainList
      .filter(chainId => chainId !== state.selectedChain)
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
  }, [balanceSortedChainList, state.selectedChain]);

  const handleTokenSelection = useCallback(
    (selection: keyof typeof tokens | 'reset') => {
      haptics.selection();
      if (selection === 'reset') {
        resetState();
      } else {
        const newToken = tokens[selection];
        setState(prev => {
          const currentChainId = prev.selectedChain;
          const newChainId = currentChainId && !(currentChainId in tokens[selection].networks) ? undefined : currentChainId;
          console.log('TEST');
          setToken(newToken);
          setChainId(newChainId);

          return {
            ...prev,
            selectedChain: newChainId,
            selectedToken: newToken,
            isInitialState: false,
          };
        });
      }
    },
    [resetState, setChainId, setToken, tokens]
  );

  const handleNetworkSelection = useCallback(
    (selection: `${ChainId}` | 'reset') => {
      haptics.selection();
      if (selection === 'reset') {
        resetState();
      } else {
        const newChainId = +selection;
        setState(prev => {
          const currentToken = prev.selectedToken;
          const newToken =
            currentToken && (!tokens[currentToken.symbol] || !(newChainId in tokens[currentToken.symbol].networks))
              ? undefined
              : currentToken;

          setToken(newToken);
          setChainId(newChainId);

          return {
            selectedChain: newChainId,
            selectedToken: newToken,
            isInitialState: false,
          };
        });
      }
    },
    [resetState, setChainId, setToken, tokens]
  );

  return (
    <Box justifyContent="center" alignItems="center" flexDirection="row" gap={5}>
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        Receive
      </Text>
      <DropdownMenu
        menuConfig={tokenMenuConfig}
        onPressMenuItem={handleTokenSelection}
        text={state.selectedToken?.symbol ?? 'a token'}
        muted={state.isInitialState}
      />
      <Text align="center" weight="bold" color="labelTertiary" size="17pt">
        on
      </Text>
      <DropdownMenu
        menuConfig={networkMenuConfig}
        onPressMenuItem={handleNetworkSelection}
        text={state.selectedChain ? chainsLabel[state.selectedChain] : 'a network'}
        muted={state.isInitialState}
      />
    </Box>
  );
}
