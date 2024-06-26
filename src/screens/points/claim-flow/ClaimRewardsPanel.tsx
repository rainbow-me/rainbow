import React, { useCallback, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Bleed, Box, Text, TextShadow, globalColors, useBackgroundColor, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, ListPanel, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId, ChainNameDisplay } from '@/__swaps__/types/chains';
import ethereumUtils, { getNetworkFromChainId, useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { useAccountAccentColor, useAccountProfile, useAccountSettings } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { NanoXDeviceAnimation } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { EthRewardsCoinIcon } from '../content/PointsContent';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { PointsErrorType } from '@/graphql/__generated__/metadata';
import { useMutation } from '@tanstack/react-query';
import { invalidatePointsQuery, usePoints } from '@/resources/points';
import { convertAmountAndPriceToNativeDisplay, convertRawAmountToBalance } from '@/helpers/utilities';
import { Network } from '@/helpers';
import { ButtonPressAnimation } from '@/components/animations';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { useNavigation } from '@/navigation';
import { RapSwapActionParameters } from '@/raps/references';
import { walletExecuteRap } from '@/raps/execute';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { chainNameFromChainId } from '@/__swaps__/utils/chains';
import { loadWallet } from '@/model/wallet';
import { getProviderForNetwork } from '@/handlers/web3';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getGasSettingsBySpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { RainbowError, logger } from '@/logger';
import { RewardsActionButton } from '../components/RewardsActionButton';

type ClaimStatus = 'idle' | 'claiming' | 'success' | PointsErrorType | 'error' | 'bridge-error';
type ClaimNetwork = '10' | '8453' | '7777777';

const CLAIM_NETWORKS = [ChainId.base, ChainId.optimism, ChainId.zora];

const PAGES = {
  CHOOSE_CLAIM_NETWORK: 'choose-claim-network',
  CLAIMING_REWARDS: 'claiming-rewards',
};

const isClaimError = (claimStatus: ClaimStatus) => {
  'worklet';
  return claimStatus === 'error' || Object.values(PointsErrorType).includes(claimStatus as PointsErrorType);
};

export const ClaimRewardsPanel = () => {
  const { goBack, goToPage, ref } = usePagerNavigation();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle');
  const [selectedNetwork, setSelectedNetwork] = useState<ClaimNetwork>();

  const chainId = selectedNetwork ? (parseInt(selectedNetwork) as ChainId) : undefined;

  return (
    <>
      <Box style={[controlPanelStyles.panelContainer, { bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30) }]}>
        <SmoothPager
          enableSwipeToGoBack={claimStatus === 'idle' || isClaimError(claimStatus)}
          initialPage={PAGES.CHOOSE_CLAIM_NETWORK}
          ref={ref}
        >
          <SmoothPager.Page
            component={
              <ChooseClaimNetwork
                claimStatus={claimStatus}
                goBack={goBack}
                goToPage={goToPage}
                selectNetwork={setSelectedNetwork}
                setClaimStatus={setClaimStatus}
              />
            }
            id={PAGES.CHOOSE_CLAIM_NETWORK}
          />
          <SmoothPager.Page
            component={<ClaimingRewards chainId={chainId} claimStatus={claimStatus} goBack={goBack} setClaimStatus={setClaimStatus} />}
            id={PAGES.CLAIMING_REWARDS}
          />
        </SmoothPager>
      </Box>
      <TapToDismiss />
    </>
  );
};

const NETWORK_LIST_ITEMS = CLAIM_NETWORKS.map(chainId => {
  return {
    IconComponent: <ChainImage chain={getNetworkFromChainId(chainId)} size={36} />,
    label: ChainNameDisplay[chainId],
    uniqueId: chainId.toString(),
    selected: false,
  };
});

const ChooseClaimNetwork = ({
  claimStatus,
  goBack,
  goToPage,
  selectNetwork,
  setClaimStatus,
}: {
  claimStatus: ClaimStatus;
  goBack: () => void;
  goToPage: (id: string) => void;
  selectNetwork: (network: ClaimNetwork) => void;
  setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>;
}) => {
  const { highContrastAccentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();

  const handleOnSelect = useCallback(
    (selectedItemId: string) => {
      selectNetwork(selectedItemId as ClaimNetwork);
      goToPage(PAGES.CLAIMING_REWARDS);

      if (isClaimError(claimStatus)) {
        setClaimStatus('idle');
      }
    },
    [claimStatus, goToPage, selectNetwork, setClaimStatus]
  );

  return (
    <ListPanel
      TitleComponent={
        <TextShadow shadowOpacity={0.3}>
          <Text align="center" color={{ custom: highContrastAccentColor }} numberOfLines={1} size="20pt" weight="heavy">
            {i18n.t(i18n.l.points.points.choose_claim_network)}
          </Text>
        </TextShadow>
      }
      disableSelectedStyle
      goBack={goBack}
      items={NETWORK_LIST_ITEMS}
      onSelect={handleOnSelect}
      pageTitle={i18n.t(i18n.l.points.points.choose_claim_network)}
      renderLabelComponent={label => (
        <TextShadow shadowOpacity={0.3}>
          <Text color="label" size="17pt" weight={isDarkMode ? 'bold' : 'heavy'}>
            {label}
          </Text>
        </TextShadow>
      )}
      scrollViewProps={{ scrollEnabled: false }}
      showBackButton={false}
    />
  );
};

const CLAIMING_STEP_HEIGHT = 280;

const ClaimingRewards = ({
  chainId,
  claimStatus,
  goBack,
  setClaimStatus,
}: {
  chainId: ChainId | undefined;
  claimStatus: ClaimStatus;
  goBack: () => void;
  setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>;
}) => {
  const { accountAddress: address, accountImage, accountColor, accountSymbol } = useAccountProfile();
  const { nativeCurrency: currency } = useAccountSettings();
  const { highContrastAccentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { goBack: closeClaimPanel } = useNavigation();
  const { data: points, refetch } = usePoints({ walletAddress: address });
  const { data: meteorologyData } = useMeteorologySuggestions({
    chainId: ChainId.optimism,
    enabled: true,
  });

  const green = useBackgroundColor('green');
  const red = useBackgroundColor('red');

  const rewards = points?.points?.user?.rewards;
  const { claimable } = rewards || {};
  const claimableBalance = convertRawAmountToBalance(claimable || '0', {
    decimals: 18,
    symbol: 'ETH',
  });
  const eth = useNativeAssetForNetwork(Network.mainnet);
  const unclaimedRewardsNativeCurrency = convertAmountAndPriceToNativeDisplay(
    claimableBalance.amount,
    eth?.price?.value || 0,
    currency
  )?.display;

  // ⚠️ TODO: This should be reworked, but this temporarily addresses an issue where the claimable amount visible
  // in the panel would drop to 0 as soon as the claim transaction completed.
  const initialClaimableAmounts = useMemo(
    () => ({
      eth: claimableBalance.display,
      nativeCurrency: unclaimedRewardsNativeCurrency,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainId]
  );

  const { mutate: claimRewards } = useMutation<{
    nonce: number | null;
  }>({
    mutationFn: async () => {
      // Fetch the native asset from the origin chain
      const opEth_ = await ethereumUtils.getNativeAssetForNetwork(getNetworkFromChainId(ChainId.optimism));
      const opEth = {
        ...opEth_,
        chainName: chainNameFromChainId(ChainId.optimism),
      };

      // Fetch the native asset from the destination chain
      let destinationEth_;
      if (chainId === ChainId.base) {
        destinationEth_ = await ethereumUtils.getNativeAssetForNetwork(getNetworkFromChainId(ChainId.base));
      } else if (chainId === ChainId.zora) {
        destinationEth_ = await ethereumUtils.getNativeAssetForNetwork(getNetworkFromChainId(ChainId.zora));
      } else {
        destinationEth_ = opEth;
      }

      // Add missing properties to match types
      const destinationEth = {
        ...destinationEth_,
        chainName: chainNameFromChainId(chainId as ChainId),
      };

      const selectedGas = {
        maxBaseFee: meteorologyData?.fast.maxBaseFee,
        maxPriorityFee: meteorologyData?.fast.maxPriorityFee,
      };

      let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {} as
        | TransactionGasParamAmounts
        | LegacyTransactionGasParamAmounts;

      gasParams = {
        maxFeePerGas: selectedGas?.maxBaseFee as string,
        maxPriorityFeePerGas: selectedGas?.maxPriorityFee as string,
      };
      const gasFeeParamsBySpeed = getGasSettingsBySpeed(ChainId.optimism);

      const actionParams = {
        address,
        toChainId: chainId,
        sellAmount: claimable as string,
        chainId: ChainId.optimism,
        assetToSell: opEth as ParsedAsset,
        assetToBuy: destinationEth as ParsedAsset,
        quote: undefined,
        // @ts-expect-error - collision between old gas types and new
        gasFeeParamsBySpeed,
        gasParams,
      } satisfies RapSwapActionParameters<'claimBridge'>;

      const provider = getProviderForNetwork(Network.optimism);
      const wallet = await loadWallet(address, false, provider);
      if (!wallet) {
        // Biometrics auth failure (retry possible)
        setClaimStatus('error');
        return { nonce: null };
      }

      try {
        const { errorMessage, nonce: bridgeNonce } = await walletExecuteRap(
          wallet,
          'claimBridge',
          // @ts-expect-error - collision between old gas types and new
          actionParams
        );

        if (errorMessage) {
          if (errorMessage.includes('[CLAIM]')) {
            // Claim error (retry possible)
            setClaimStatus('error');
          } else {
            // Bridge error (retry not possible)
            setClaimStatus('bridge-error');
          }

          logger.error(new RainbowError('ETH REWARDS CLAIM ERROR'), { message: errorMessage });

          return { nonce: null };
        }

        if (typeof bridgeNonce === 'number') {
          // Clear and refresh claim data so available claim UI disappears
          invalidatePointsQuery(address);
          refetch();
          return { nonce: bridgeNonce };
        } else {
          setClaimStatus('error');
          return { nonce: null };
        }
      } catch (e) {
        setClaimStatus('error');
        return { nonce: null };
      }
    },
    onError: error => {
      const errorCode =
        error && typeof error === 'object' && 'code' in error && isClaimError(error.code as PointsErrorType)
          ? (error.code as PointsErrorType)
          : 'error';
      setClaimStatus(errorCode);
    },
    onSuccess: async ({ nonce }: { nonce: number | null }) => {
      if (typeof nonce === 'number') {
        setClaimStatus('success');
      }
    },
  });

  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
      case 'claiming':
        return i18n.t(i18n.l.points.points.claim_rewards);
      case 'success':
      case 'bridge-error':
        return i18n.t(i18n.l.button.done);
      case 'error':
      default:
        return i18n.t(i18n.l.points.points.try_again);
    }
  }, [claimStatus]);

  const panelTitle = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
        return i18n.t(i18n.l.points.points.claim_on_network, {
          network: chainId ? ChainNameDisplay[chainId] : '',
        });
      case 'claiming':
        return i18n.t(i18n.l.points.points.claiming_on_network, {
          network: chainId ? ChainNameDisplay[chainId] : '',
        });
      case 'success':
        return i18n.t(i18n.l.points.points.claimed_on_network, {
          network: chainId ? ChainNameDisplay[chainId] : '',
        });
      case 'bridge-error':
        return i18n.t(i18n.l.points.points.bridge_error);
      case 'error':
      default:
        return i18n.t(i18n.l.points.points.error_claiming);
    }
  }, [chainId, claimStatus]);

  const panelTitleColor = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
      case 'claiming':
      case 'bridge-error':
        return highContrastAccentColor;
      case 'success':
        return green;
      case 'error':
      default:
        return red;
    }
  }, [claimStatus, green, highContrastAccentColor, red]);

  const claimableAmountStyle = useAnimatedStyle(() => {
    const shouldSlideUp =
      claimStatus === 'idle' || claimStatus === 'success' || claimStatus === 'bridge-error' || isClaimError(claimStatus);
    return {
      transform: [{ translateY: withTiming(shouldSlideUp ? -12 : 12, TIMING_CONFIGS.slowFadeConfig) }],
    };
  });

  const claimButtonStyle = useAnimatedStyle(() => {
    const shouldDisplay =
      claimStatus === 'idle' || claimStatus === 'success' || claimStatus === 'bridge-error' || isClaimError(claimStatus);
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
      pointerEvents: shouldDisplay ? 'auto' : 'none',
    };
  });

  const panelAvatarStyle = useAnimatedStyle(() => {
    const shouldDisplay = claimStatus === 'idle' || isClaimError(claimStatus);
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  return (
    <Panel>
      <ListHeader
        BackButtonComponent={
          <TextShadow shadowOpacity={0.3}>
            <Text
              align="center"
              color={claimStatus === 'success' ? 'green' : { custom: highContrastAccentColor }}
              size="icon 20px"
              weight="bold"
            >
              􀆉
            </Text>
          </TextShadow>
        }
        RightComponent={
          <Animated.View style={[panelAvatarStyle, { height: 20, width: 20 }]}>
            {accountImage ? (
              <ImageAvatar image={accountImage} marginRight={10} size="smaller" />
            ) : (
              <ContactAvatar color={accountColor} marginRight={10} size="smaller" value={accountSymbol} />
            )}
          </Animated.View>
        }
        TitleComponent={
          <Box alignItems="center" flexDirection="row" gap={claimStatus === 'claiming' ? 10 : 6} justifyContent="center">
            {claimStatus === 'claiming' && (
              <AnimatedSpinner
                color={highContrastAccentColor}
                isLoading
                requireSrc={require('@/assets/spinner.png')}
                scaleInFrom={0.4}
                size={18}
              />
            )}
            {(claimStatus === 'success' || isClaimError(claimStatus) || claimStatus === 'bridge-error') && (
              <TextShadow shadowOpacity={0.3}>
                <Text align="center" color={{ custom: panelTitleColor }} size="icon 17px" weight="heavy">
                  {claimStatus === 'success' ? '􀁣' : '􀇿'}
                </Text>
              </TextShadow>
            )}
            <TextShadow shadowOpacity={0.3}>
              <Text align="center" color={{ custom: panelTitleColor }} size="20pt" weight="heavy">
                {panelTitle}
              </Text>
            </TextShadow>
          </Box>
        }
        goBack={goBack}
        showBackButton={claimStatus === 'idle' || isClaimError(claimStatus)}
      />
      <Box
        alignItems="center"
        flexDirection="row"
        gap={8}
        height={{ custom: CLAIMING_STEP_HEIGHT }}
        justifyContent="center"
        style={{ zIndex: -1 }}
      >
        <NanoXDeviceAnimation
          CenterComponent={
            <Box alignItems="center" height={{ custom: CLAIMING_STEP_HEIGHT - 24 }} justifyContent="space-around">
              <Box
                alignItems="center"
                as={Animated.View}
                gap={28}
                height={{ custom: CLAIMING_STEP_HEIGHT - 24 }}
                justifyContent="center"
                style={claimableAmountStyle}
              >
                <Box alignItems="center" flexDirection="row" gap={8} justifyContent="center">
                  <Bleed vertical="8px">
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
                      <EthRewardsCoinIcon animatedBorder />
                    </View>
                  </Bleed>
                  <TextShadow blur={12} color={globalColors.grey100} shadowOpacity={0.1} y={4}>
                    <Text align="center" color="label" size="44pt" weight="black">
                      {initialClaimableAmounts.nativeCurrency}
                    </Text>
                  </TextShadow>
                </Box>
                {claimStatus === 'bridge-error' ? (
                  <Box paddingHorizontal="44px">
                    <Text align="center" color="labelQuaternary" size="13pt / 135%" weight="semibold">
                      {i18n.t(i18n.l.points.points.bridge_error_explainer, {
                        network: chainId ? ChainNameDisplay[chainId] : '',
                      })}
                    </Text>
                  </Box>
                ) : (
                  <TextShadow
                    color={claimStatus === 'success' ? globalColors.grey100 : undefined}
                    shadowOpacity={claimStatus === 'success' ? 0.2 : 0.3}
                  >
                    <Text align="center" color={{ custom: panelTitleColor }} size="20pt" weight="black">
                      {initialClaimableAmounts.eth}
                    </Text>
                  </TextShadow>
                )}
              </Box>
              <Animated.View style={claimButtonStyle}>
                <ButtonPressAnimation
                  onPress={() => {
                    if (claimStatus === 'idle' || isClaimError(claimStatus)) {
                      // Almost impossible to reach here since gas prices load immediately
                      // but in that case I'm disabling the action temporarily to prevent
                      // any issues that might arise from the gas prices not being loaded
                      if (!meteorologyData) return;

                      setClaimStatus('claiming');
                      claimRewards();
                    } else if (claimStatus === 'success' || claimStatus === 'bridge-error') {
                      closeClaimPanel();
                    }
                  }}
                  scaleTo={0.925}
                  style={{
                    alignItems: 'center',
                    alignSelf: 'center',
                    bottom: 4,
                    left: 0,
                    height: 80,
                    justifyContent: 'center',
                    paddingVertical: 12,
                    pointerEvents: 'box-only',
                    width: DEVICE_WIDTH - 28 * 2,
                  }}
                >
                  <RewardsActionButton
                    borderRadius={22}
                    color={claimStatus === 'success' ? green : highContrastAccentColor}
                    label={buttonLabel}
                    width={DEVICE_WIDTH - 28 * 2}
                  />
                </ButtonPressAnimation>
              </Animated.View>
            </Box>
          }
          backgroundColor={isDarkMode ? '#191A1C' : globalColors.white100}
          blur={isDarkMode ? 32 : 64}
          centerComponentStyle={{ height: CLAIMING_STEP_HEIGHT, left: 0, right: 0, top: 0 }}
          circleColors={['#B2348C', '#FF6040', '#FFFF00', '#34FF3B', '#24D2FB', '#B2348C', '#FF6040', '#24D2FB']}
          duration={10000}
          isConnected={claimStatus === 'success'}
          movementFactor={1.75}
          opacity={(isDarkMode ? 0.4 : 1) * (claimStatus === 'success' || isClaimError(claimStatus) ? 0.75 : 1)}
          showGridDots={false}
          state={claimStatus === 'idle' || claimStatus === 'bridge-error' || isClaimError(claimStatus) ? 'idle' : 'loading'}
          wrapperStyle={{ height: CLAIMING_STEP_HEIGHT, top: 0 }}
        />
      </Box>
    </Panel>
  );
};
