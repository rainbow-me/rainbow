import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Bleed, Box, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, ListPanel, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@rainbow-me/provider/dist/references/chains';
import { ChainNameDisplay } from '@/__swaps__/types/chains';
import { getNetworkFromChainId, useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { useAccountAccentColor, useAccountProfile, useAccountSettings } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { NanoXDeviceAnimation } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { EthRewardsCoinIcon } from '../content/PointsContent';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { ClaimUserRewardsMutation, PointsErrorType } from '@/graphql/__generated__/metadata';
import { useMutation } from '@tanstack/react-query';
import { metadataPOSTClient } from '@/graphql';
import { invalidatePointsQuery, usePoints } from '@/resources/points';
import { convertAmountAndPriceToNativeDisplay, convertRawAmountToBalance } from '@/helpers/utilities';
import { Network } from '@/helpers';

const PAGES = {
  CHOOSE_CLAIM_NETWORK: 'choose-claim-network',
  CLAIMING_OP: 'claiming-op',
  CLAIMING_BASE: 'claiming-base',
  CLAIMING_ZORA: 'claiming-zora',
};
const CLAIM_NETWORKS = [ChainId.optimism, ChainId.base, ChainId.zora];
type ClaimNetwork = '10' | '8453' | '7777777';

export const ClaimRewardsPanel = () => {
  const { goBack, goToPage, ref } = usePagerNavigation();
  const [selectedNetwork, setSelectedNetwork] = useState<ClaimNetwork>();
  const chainId = selectedNetwork ? (parseInt(selectedNetwork) as ChainId) : undefined;

  return (
    <>
      <Box style={[controlPanelStyles.panelContainer, { bottom: Math.max(safeAreaInsetValues.bottom + 5, 8) }]}>
        <SmoothPager enableSwipeToGoBack={false} enableSwipeToGoForward={false} initialPage={PAGES.CHOOSE_CLAIM_NETWORK} ref={ref}>
          <SmoothPager.Page
            component={<ChooseClaimNetwork goBack={goBack} goToPage={goToPage} selectNetwork={setSelectedNetwork} />}
            id={PAGES.CHOOSE_CLAIM_NETWORK}
          />
          <SmoothPager.Page component={<ClaimingRewards chainId={chainId} />} id={PAGES.CLAIMING_OP} />
        </SmoothPager>
      </Box>
      <TapToDismiss />
    </>
  );
};

const ChooseClaimNetwork = ({
  goBack,
  goToPage,
  selectNetwork,
}: {
  goBack: () => void;
  goToPage: (id: string) => void;
  selectNetwork: (network: ClaimNetwork) => void;
}) => {
  const { highContrastAccentColor } = useAccountAccentColor();

  const networkListItems = useMemo(() => {
    const claimFees = {
      [ChainId.optimism]: i18n.t(i18n.l.points.points.free_to_claim),
      [ChainId.base]: i18n.t(i18n.l.points.points.has_bridge_fee),
      [ChainId.zora]: i18n.t(i18n.l.points.points.has_bridge_fee),
    };

    return CLAIM_NETWORKS.map(chainId => {
      return {
        IconComponent: <ChainImage chain={getNetworkFromChainId(chainId)} size={36} />,
        label: ChainNameDisplay[chainId],
        secondaryLabel: claimFees[chainId],
        uniqueId: chainId.toString(),
        selected: false,
      };
    });
  }, []);

  const handleOnSelect = useCallback(
    (selectedItemId: string) => {
      selectNetwork(selectedItemId as ClaimNetwork);
      goToPage(
        {
          [ChainId.optimism]: PAGES.CLAIMING_OP,
          [ChainId.base]: PAGES.CLAIMING_BASE,
          [ChainId.zora]: PAGES.CLAIMING_ZORA,
        }[selectedItemId as ClaimNetwork]
      );
    },
    [goToPage]
  );

  const animatedAccentColor = useSharedValue<string | undefined>(undefined);
  const selectedItemId = useSharedValue('');

  return (
    <ListPanel
      TitleComponent={
        <TextShadow shadowOpacity={0.3}>
          <Text align="center" color={{ custom: highContrastAccentColor }} size="20pt" weight="heavy">
            {i18n.t(i18n.l.points.points.choose_claim_network)}
          </Text>
        </TextShadow>
      }
      animatedAccentColor={animatedAccentColor}
      goBack={goBack}
      items={networkListItems}
      onSelect={handleOnSelect}
      pageTitle={i18n.t(i18n.l.points.points.choose_claim_network)}
      renderLabelComponent={label => (
        <TextShadow shadowOpacity={0.3}>
          <Text color="label" size="17pt" weight="bold">
            {label}
          </Text>
        </TextShadow>
      )}
      scrollViewProps={{ scrollEnabled: false }}
      selectedItemId={selectedItemId}
    />
  );
};

const CLAIMING_STEP_HEIGHT = 272;

const ClaimingRewards = ({ chainId }: { chainId?: ChainId }) => {
  const { accountAddress: address } = useAccountProfile();
  const { nativeCurrency: currency } = useAccountSettings();
  const { highContrastAccentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const [claimError, setClaimError] = useState<PointsErrorType>();
  const { data: points, refetch } = usePoints({
    walletAddress: address,
  });
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

  const { mutate: claimRewards, isSuccess: claimSuccess } = useMutation<ClaimUserRewardsMutation['claimUserRewards']>({
    mutationFn: async () => {
      const response = await metadataPOSTClient.claimUserRewards({ address });
      const claimInfo = response?.claimUserRewards;

      if (claimInfo?.error) {
        setClaimError(claimInfo?.error.type);
      }

      // clear and refresh claim data so available claim UI disappears
      invalidatePointsQuery(address);
      await refetch();

      return claimInfo;
    },
    onSuccess: async (data: ClaimUserRewardsMutation['claimUserRewards']) => {
      // do bridging and clean up here
    },
  });

  useEffect(() => {
    if (chainId) {
      claimRewards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  return (
    <Panel>
      <ListHeader
        TitleComponent={
          <TextShadow shadowOpacity={0.3}>
            <Text align="center" color={{ custom: highContrastAccentColor }} size="20pt" weight="heavy">
              {i18n.t(i18n.l.points.points.claiming_on_network, {
                network: chainId ? ChainNameDisplay[chainId] : '',
              })}
            </Text>
          </TextShadow>
        }
      />
      <Box alignItems="center" flexDirection="row" gap={8} height={{ custom: CLAIMING_STEP_HEIGHT }} justifyContent="center">
        <NanoXDeviceAnimation
          CenterComponent={
            <Box alignItems="center" flexDirection="row" gap={8} height={{ custom: CLAIMING_STEP_HEIGHT - 24 }} justifyContent="center">
              <Bleed vertical="8px">
                <View
                  style={
                    IS_IOS && isDarkMode
                      ? { shadowColor: globalColors.grey100, shadowOpacity: 0.2, shadowOffset: { height: 4, width: 0 }, shadowRadius: 6 }
                      : {}
                  }
                >
                  <EthRewardsCoinIcon animatedBorder />
                </View>
              </Bleed>
              <TextShadow blur={20} color={globalColors.grey100} shadowOpacity={0.1}>
                <Text align="center" color="label" size="44pt" weight="black">
                  {unclaimedRewardsNativeCurrency}
                </Text>
              </TextShadow>
            </Box>
          }
          centerComponentStyle={{ height: CLAIMING_STEP_HEIGHT, left: 0, right: 0, top: 0 }}
          showGridDots={false}
          state="loading"
          wrapperStyle={{ height: CLAIMING_STEP_HEIGHT, top: 0 }}
        />
      </Box>
    </Panel>
  );
};
