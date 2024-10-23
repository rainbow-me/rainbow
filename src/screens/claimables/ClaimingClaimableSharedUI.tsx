import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
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
import { chainsLabel, chainsName } from '@/chains';
import { useNavigation } from '@/navigation';
import { TextColor } from '@/design-system/color/palettes';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { convertAmountToNativeDisplayWorklet } from '@/__swaps__/utils/numbers';
import { useAccountSettings, useWallets } from '@/hooks';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { debounce, set } from 'lodash';
import { DropdownMenu, MenuConfig, MenuItem } from '@/components/DropdownMenu';
import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { DAI_ADDRESS, WBTC_ADDRESS } from '@/references';
import { ChainId } from '@/chains/types';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { ParsedAddressAsset } from '@/entities';

const BUTTON_WIDTH = deviceUtils.dimensions.width - 52;

export type ClaimStatus =
  | 'idle' // initial state
  | 'claiming' // user has pressed the claim button
  | 'pending' // claim has been submitted but we don't have a tx hash
  | 'success' // claim has been submitted and we have a tx hash
  | 'error'; // claim has failed

const DAI_ADDRESS_MAINNET = '0x6b175474e89094c44da98b954eedeac495271d0f';
const DAI_ADDRESS_BASE = '0x50c5725949a6f0c72e6c4a641f24049a917db0cb';
const DAI_ADDRESS_OPTIMISM = '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1';
const DAI_ADDRESS_AVALANCHE = '0xd586e7f844cea2f87f50152665bcbc2c279d8d70';
const DAI_ADDRESS_ARBITRUM = '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1';
const DAI_ADDRESS_POLYGON = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
const DAI_ADDRESS_BSC = '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3';

const WBTC_ADDRESS_MAINNET = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const WBTC_ADDRESS_BLAST = '0xf7bc58b8d8f97adc129cfc4c9f45ce3c0e1d2692';
const WBTC_ADDRESS_OPTIMISM = '0x68f180fcce6836688e9084f035309e29bf0a2095';
const WBTC_ADDRESS_AVALANCHE = '0x50b7545627a5162f82a992c33b87adc75187b218';
const WBTC_ADDRESS_ARBITRUM = '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f';
const WBTC_ADDRESS_POLYGON = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6';
const WBTC_ADDRESS_BSC = '0x0555e30da8f98308edb960aa94c0db47230d2b9c';

type TokenToReceive = Pick<ParsedAddressAsset, 'networks' | 'symbol' | 'icon_url' | 'name'>;

const DAI: TokenToReceive = {
  networks: {
    [ChainId.mainnet]: { address: DAI_ADDRESS_MAINNET },
    [ChainId.avalanche]: { address: DAI_ADDRESS_AVALANCHE },
    [ChainId.arbitrum]: { address: DAI_ADDRESS_ARBITRUM },
    [ChainId.bsc]: { address: DAI_ADDRESS_BSC },
    [ChainId.optimism]: { address: DAI_ADDRESS_OPTIMISM },
    [ChainId.polygon]: { address: DAI_ADDRESS_POLYGON },
    [ChainId.base]: { address: DAI_ADDRESS_BASE },
  },
  symbol: 'DAI',
  icon_url: '',
  name: 'Dai',
};

const WBTC: TokenToReceive = {
  networks: {
    [ChainId.mainnet]: { address: WBTC_ADDRESS_MAINNET },
    [ChainId.avalanche]: { address: WBTC_ADDRESS_AVALANCHE },
    [ChainId.arbitrum]: { address: WBTC_ADDRESS_ARBITRUM },
    [ChainId.bsc]: { address: WBTC_ADDRESS_BSC },
    [ChainId.optimism]: { address: WBTC_ADDRESS_OPTIMISM },
    [ChainId.polygon]: { address: WBTC_ADDRESS_POLYGON },
    [ChainId.blast]: { address: WBTC_ADDRESS_BLAST },
  },
  symbol: 'WBTC',
  icon_url: '',
  name: 'Wrapped Bitcoin',
};

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

  const [tokenToReceive, setTokenToReceive] = useState<string | undefined>(claimable.asset.symbol);
  const [chainId, setChainId] = useState<ChainId>(claimable.chainId);
  const [initialState, setInitialState] = useState(true);

  const nativeAsset = useNativeAsset({ chainId });

  const tokens = useMemo(
    () => ({
      [DAI.symbol]: DAI,
      [WBTC.symbol]: WBTC,
      [claimable.asset.symbol]: claimable.asset,
      ...(nativeAsset ? { [nativeAsset.symbol]: nativeAsset } : {}),
    }),
    [claimable.asset, nativeAsset]
  );

  const tokenMenuConfig = useMemo<MenuConfig<string>>(() => {
    const availableTokens = Object.values(tokens)
      .map(token => {
        if (chainId in token.networks || initialState) {
          return { actionKey: token.symbol, actionTitle: token.name };
        }
      })
      .filter((item): item is MenuItem<string> => !!item)
      .sort((a, b) => (a.actionTitle < b.actionTitle ? 1 : -1));
    return {
      menuItems: [
        { actionKey: 'reset', actionTitle: 'Reset', icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' } },
        ...availableTokens,
      ],
    };
  }, [chainId, initialState, tokens]);

  const onPressTokenMenuItem = useCallback(
    (selection: string) => {
      if (selection === tokenToReceive) return;

      haptics.selection();
      if (selection === 'reset') {
        setInitialState(true);
        setTokenToReceive(claimable.asset.symbol);
        setChainId(claimable.chainId);
      } else {
        setInitialState(false);
        setTokenToReceive(selection);
      }
    },
    [claimable.asset.symbol, claimable.chainId, tokenToReceive]
  );

  const balanceSortedChainList = useUserAssetsStore(state => state.getBalanceSortedChainList());

  const networkMenuConfig = useMemo<MenuConfig<`${ChainId}`>>(() => {
    const supportedChains = balanceSortedChainList.map(chainId => {
      return {
        actionKey: `${chainId}`,
        actionTitle: chainsLabel[chainId],
        icon: {
          iconType: 'ASSET',
          // NOTE: chainsName[chainId] for mainnet is 'mainnet' and we need it to be 'ethereum'
          iconValue: chainId === ChainId.mainnet ? 'ethereumBadge' : `${chainsName[chainId]}BadgeNoShadow`,
        },
      };
    });
    return {
      menuItems: [
        { actionKey: 'reset', actionTitle: 'Reset', icon: { iconType: 'SYSTEM', iconValue: 'arrow.counterclockwise' } },
        ...supportedChains,
      ],
    };
  }, [balanceSortedChainList]);

  const onPressNetworkMenuItem = useCallback(
    (selection: `${ChainId}`) => {
      const selectedChainId = Number(selection);
      if (chainId === selectedChainId) return;

      haptics.selection();
      setChainId(selectedChainId);
      if (selection === 'reset') {
        setInitialState(true);
        setTokenToReceive(claimable.asset.symbol);
        setChainId(claimable.chainId);
      } else {
        setInitialState(false);
        if (tokenToReceive && !(selectedChainId in tokens[tokenToReceive].networks)) {
          setTokenToReceive(undefined);
        }
      }
    },
    [chainId, claimable.asset.symbol, claimable.chainId, tokenToReceive, tokens]
  );

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
                <DropdownMenu menuConfig={tokenMenuConfig} onPressMenuItem={onPressTokenMenuItem}>
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
                      <Text align="center" weight="heavy" color={initialState ? 'labelQuaternary' : 'label'} size="17pt">
                        {tokenToReceive ? tokens[tokenToReceive].symbol : 'a token'}
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
                <DropdownMenu menuConfig={networkMenuConfig} onPressMenuItem={onPressNetworkMenuItem}>
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
                      <Text align="center" weight="heavy" color={initialState ? 'labelQuaternary' : 'label'} size="17pt">
                        {chainsLabel[chainId]}
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
