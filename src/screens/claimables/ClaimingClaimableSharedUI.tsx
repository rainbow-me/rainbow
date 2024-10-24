import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccentColorProvider, Bleed, Box, Inline, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { deviceUtils, haptics, safeAreaInsetValues, watchingAlert } from '@/utils';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { SponsoredClaimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { FasterImageView } from '@candlefinance/faster-image';
import { chainsLabel, chainsName, chainsNativeAsset } from '@/chains';
import { useNavigation } from '@/navigation';
import { TextColor } from '@/design-system/color/palettes';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { convertAmountToNativeDisplayWorklet } from '@/__swaps__/utils/numbers';
import { useAccountSettings, useWallets } from '@/hooks';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { debounce } from 'lodash';
import { DropdownMenu } from '@/components/DropdownMenu';
import { DAI_ADDRESS, ETH_SYMBOL, WBTC_ADDRESS } from '@/references';
import { ChainId } from '@/chains/types';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ParsedAddressAsset } from '@/entities';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';

interface TokenToReceive {
  networks: Partial<Record<ChainId, { address: string }>>;
  symbol: string;
  iconUrl?: string;
  name: string;
  isNativeAsset: boolean;
}

type TokenMap = Record<TokenToReceive['symbol'], TokenToReceive>;

// Types
interface DropdownState {
  selectedToken: string | undefined;
  selectedChain: ChainId | undefined;
  isInitialState: boolean;
}

interface UseDropdownMenuProps {
  claimableAsset: ParsedAddressAsset;
}

// Custom hook to manage dropdown state and logic
const useDropdownMenu = ({ claimableAsset }: UseDropdownMenuProps) => {
  const { nativeCurrency } = useAccountSettings();
  const balanceSortedChainList = useUserAssetsStore(state => state.getBalanceSortedChainList());

  const [state, setState] = useState<DropdownState>({
    selectedToken: claimableAsset.symbol,
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
        iconUrl: claimableAsset.icon_url,
        name: claimableAsset.name,
        symbol: claimableAsset.symbol,
        networks: claimableAsset.networks,
        isNativeAsset: false,
      },
      ...(dai && {
        [dai.symbol]: {
          iconUrl: dai.icon_url,
          name: dai.name,
          symbol: dai.symbol,
          networks: dai.networks,
          isNativeAsset: false,
        },
      }),
      ...(wbtc && {
        [wbtc.symbol]: {
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
      selectedToken: claimableAsset.symbol,
      selectedChain: claimableAsset.chainId,
      isInitialState: true,
    });
  }, [claimableAsset.symbol, claimableAsset.chainId]);

  const tokenMenuConfig = useMemo(() => {
    const availableTokens = Object.values(tokens)
      .filter(token => {
        // exclude if token is already selected
        if (token.symbol === state.selectedToken) {
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
        setState(prev => {
          const currentChain = prev.selectedChain;
          const newChain = currentChain && !(currentChain in tokens[selection].networks) ? undefined : currentChain;

          return {
            ...prev,
            selectedChain: newChain,
            selectedToken: selection,
            isInitialState: false,
          };
        });
      }
    },
    [resetState, tokens]
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
            currentToken && (!tokens[currentToken] || !(newChainId in tokens[currentToken].networks)) ? undefined : currentToken;

          return {
            selectedChain: newChainId,
            selectedToken: newToken,
            isInitialState: false,
          };
        });
      }
    },
    [resetState, tokens]
  );

  return {
    state,
    tokenMenuConfig,
    networkMenuConfig,
    handleTokenSelection,
    handleNetworkSelection,
  };
};

const BUTTON_WIDTH = deviceUtils.dimensions.width - 52;

export type ClaimStatus =
  | 'idle' // initial state
  | 'claiming' // user has pressed the claim button
  | 'pending' // claim has been submitted but we don't have a tx hash
  | 'success' // claim has been submitted and we have a tx hash
  | 'error'; // claim has failed

export const ClaimingClaimableSharedUI = ({
  claim,
  claimable,
  claimStatus,
  hasSufficientFunds,
  isGasReady,
  isTransactionReady,
  nativeCurrencyGasFeeDisplay,
  setClaimStatus,
}:
  | {
      claim: () => void;
      claimable: TransactionClaimable;
      claimStatus: ClaimStatus;
      hasSufficientFunds: boolean;
      isGasReady: boolean;
      isTransactionReady: boolean;
      nativeCurrencyGasFeeDisplay: string;
      setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>;
    }
  | {
      claim: () => void;
      claimable: SponsoredClaimable;
      claimStatus: ClaimStatus;
      hasSufficientFunds?: never;
      isGasReady?: never;
      isTransactionReady?: never;
      nativeCurrencyGasFeeDisplay?: never;
      setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>;
    }) => {
  const { isDarkMode } = useColorMode();
  const { nativeCurrency } = useAccountSettings();
  const theme = useTheme();
  const { goBack } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const isButtonDisabled =
    claimStatus === 'claiming' ||
    ((claimStatus === 'idle' || claimStatus === 'error') && claimable.type === 'transaction' && !isTransactionReady);

  const shouldShowClaimText = claimStatus === 'idle' && (claimable.type !== 'transaction' || hasSufficientFunds);

  const claimAmountNativeDisplay = convertAmountToNativeDisplayWorklet(claimable.value.nativeAsset.amount, nativeCurrency, true);

  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
        if (shouldShowClaimText) {
          return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimable.value.claimAsset.display });
        } else {
          return i18n.t(i18n.l.claimables.panel.insufficient_funds);
        }
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claim_in_progress);
      case 'pending':
      case 'success':
        return i18n.t(i18n.l.button.done);
      case 'error':
      default:
        return i18n.t(i18n.l.points.points.try_again);
    }
  }, [claimable.value.claimAsset.display, claimStatus, shouldShowClaimText]);

  const panelTitle = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
        return i18n.t(i18n.l.claimables.panel.claim);
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claiming);
      case 'pending':
        return i18n.t(i18n.l.claimables.panel.tokens_on_the_way);
      case 'success':
        return i18n.t(i18n.l.claimables.panel.claimed);
      case 'error':
      default:
        return i18n.t(i18n.l.claimables.panel.claiming_failed);
    }
  }, [claimStatus]);

  const panelTitleColor: TextColor = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
      case 'claiming':
        return 'label';
      case 'pending':
      case 'success':
        return 'green';
      case 'error':
      default:
        return 'red';
    }
  }, [claimStatus]);

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    switch (claimStatus) {
      case 'idle':
      case 'error':
        animationProgress.value = withTiming(0, { duration: 300 });
        break;
      case 'claiming':
      case 'pending':
      case 'success':
      default:
        animationProgress.value = withTiming(1, { duration: 300 });
        break;
    }
  }, [claimStatus, animationProgress]);

  const gasAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: (1 - animationProgress.value) * 30,
      opacity: 1 - animationProgress.value,
    };
  });

  const onPress = useCallback(
    debounce(() => {
      if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
        if (claimStatus === 'idle' || claimStatus === 'error') {
          setClaimStatus('claiming');
          claim();
        } else if (claimStatus === 'success' || claimStatus === 'pending') {
          goBack();
        }
      } else {
        watchingAlert();
      }
    }, 300),
    [claimStatus, claim, goBack, isReadOnlyWallet, setClaimStatus]
  );

  const { state, tokenMenuConfig, networkMenuConfig, handleTokenSelection, handleNetworkSelection } = useDropdownMenu({
    claimableAsset: { ...claimable.asset, chainId: ChainId.degen },
  });

  return (
    <>
      <Box
        style={[
          controlPanelStyles.panelContainer,
          { bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30), alignItems: 'center', width: '100%' },
        ]}
      >
        <Panel>
          <ListHeader
            TitleComponent={
              <Box alignItems="center" flexDirection="row" gap={10} justifyContent="center">
                <Box borderRadius={6} borderWidth={1} borderColor={{ custom: 'rgba(0, 0, 0, 0.03)' }}>
                  <FasterImageView source={{ url: claimable.iconUrl }} style={{ height: 20, width: 20 }} />
                </Box>
                <TextShadow shadowOpacity={0.3}>
                  <Text align="center" color={panelTitleColor} size="20pt" weight="heavy">
                    {panelTitle}
                  </Text>
                </TextShadow>
              </Box>
            }
            showBackButton={false}
          />
          <Box alignItems="center" paddingTop="44px" paddingBottom="24px" gap={42}>
            <Box gap={20} alignItems="center">
              <Box alignItems="center" flexDirection="row" gap={8} justifyContent="center">
                <Bleed vertical={{ custom: 4.5 }}>
                  <View
                    style={
                      IS_IOS && isDarkMode
                        ? {
                            shadowColor: globalColors.grey100,
                            shadowOpacity: 0.2,
                            shadowOffset: { height: 4, width: 0 },
                            shadowRadius: 6,
                          }
                        : {}
                    }
                  >
                    <RainbowCoinIcon
                      size={40}
                      icon={claimable.asset.icon_url}
                      chainId={claimable.chainId}
                      symbol={claimable.asset.symbol}
                      theme={theme}
                      colors={undefined}
                    />
                  </View>
                </Bleed>
                <TextShadow blur={12} color={globalColors.grey100} shadowOpacity={0.1} y={4}>
                  <Text align="center" color="label" size="44pt" weight="black">
                    {claimAmountNativeDisplay}
                  </Text>
                </TextShadow>
              </Box>
              <Box justifyContent="center" alignItems="center" flexDirection="row" gap={5}>
                <Text align="center" weight="bold" color="labelTertiary" size="17pt">
                  Receive
                </Text>
                <DropdownMenu menuConfig={tokenMenuConfig} onPressMenuItem={handleTokenSelection}>
                  <ButtonPressAnimation>
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
                      <Text align="center" weight="heavy" color={state.isInitialState ? 'labelQuaternary' : 'label'} size="17pt">
                        {state.selectedToken ? state.selectedToken : 'a token'}
                      </Text>
                      <Text align="center" weight="heavy" color="labelSecondary" size="icon 12px">
                        􀆏
                      </Text>
                    </Box>
                  </ButtonPressAnimation>
                </DropdownMenu>
                <Text align="center" weight="bold" color="labelTertiary" size="17pt">
                  on
                </Text>
                <DropdownMenu menuConfig={networkMenuConfig} onPressMenuItem={handleNetworkSelection}>
                  <ButtonPressAnimation>
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
                      <Text align="center" weight="heavy" color={state.isInitialState ? 'labelQuaternary' : 'label'} size="17pt">
                        {state.selectedChain ? chainsLabel[state.selectedChain] : 'a network'}
                      </Text>
                      <Text align="center" weight="heavy" color="labelSecondary" size="icon 12px">
                        􀆏
                      </Text>
                    </Box>
                  </ButtonPressAnimation>
                </DropdownMenu>
              </Box>
            </Box>
            <Box alignItems="center" width="full">
              <ButtonPressAnimation
                disabled={isButtonDisabled}
                style={{ width: '100%', paddingHorizontal: 18 }}
                scaleTo={0.96}
                onPress={onPress}
              >
                <AccentColorProvider color={`rgba(41, 90, 247, ${isButtonDisabled ? 0.2 : 1})`}>
                  <Box
                    background="accent"
                    shadow="30px accent"
                    borderRadius={43}
                    height={{ custom: 48 }}
                    width={{ custom: BUTTON_WIDTH }}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <ShimmerAnimation color="#FFFFFF" enabled={!isButtonDisabled || claimStatus === 'claiming'} width={BUTTON_WIDTH} />
                    <Inline alignVertical="center" space="6px">
                      {shouldShowClaimText && (
                        <TextShadow shadowOpacity={isButtonDisabled ? 0 : 0.3}>
                          <Text align="center" color="label" size="icon 20px" weight="heavy">
                            􀎽
                          </Text>
                        </TextShadow>
                      )}
                      <TextShadow shadowOpacity={isButtonDisabled ? 0 : 0.3}>
                        <Text align="center" color="label" size="20pt" weight="heavy">
                          {buttonLabel}
                        </Text>
                      </TextShadow>
                    </Inline>
                  </Box>
                </AccentColorProvider>
              </ButtonPressAnimation>
              {claimable.type === 'transaction' && (
                <Animated.View style={gasAnimatedStyle}>
                  <Box paddingTop="20px">
                    {isGasReady ? (
                      <Inline alignVertical="center" space="2px">
                        <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
                          􀵟
                        </Text>
                        <Text color="labelQuaternary" size="13pt" weight="bold">
                          {i18n.t(i18n.l.claimables.panel.amount_to_claim_on_network, {
                            amount: nativeCurrencyGasFeeDisplay,
                            network: chainsLabel[claimable.chainId],
                          })}
                        </Text>
                      </Inline>
                    ) : (
                      <Text color="labelQuaternary" size="13pt" weight="bold">
                        {i18n.t(i18n.l.claimables.panel.calculating_gas_fee)}
                      </Text>
                    )}
                  </Box>
                </Animated.View>
              )}
            </Box>
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
};
