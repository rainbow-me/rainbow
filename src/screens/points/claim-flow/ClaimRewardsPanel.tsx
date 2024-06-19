import React, { useCallback, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Bleed, Box, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, ListPanel, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@rainbow-me/provider/dist/references/chains';
import { ChainNameDisplay } from '@/__swaps__/types/chains';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { useAccountAccentColor } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { NanoXDeviceAnimation } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { EthRewardsCoinIcon } from '../content/PointsContent';
import { View } from 'react-native';
import { IS_IOS } from '@/env';

const PAGES = {
  CHOOSE_CLAIM_NETWORK: 'choose-claim-network',
  CLAIMING_REWARDS: 'claiming-rewards',
};

export const ClaimRewardsPanel = () => {
  const { goBack, goToPage, ref } = usePagerNavigation();

  return (
    <>
      <Box style={[controlPanelStyles.panelContainer, { bottom: Math.max(safeAreaInsetValues.bottom + 5, 8) }]}>
        <SmoothPager enableSwipeToGoBack={false} enableSwipeToGoForward={false} initialPage={PAGES.CHOOSE_CLAIM_NETWORK} ref={ref}>
          <SmoothPager.Page component={<ChooseClaimNetwork goBack={goBack} goToPage={goToPage} />} id={PAGES.CHOOSE_CLAIM_NETWORK} />
          <SmoothPager.Page component={<ChooseClaimNetwork goBack={goBack} goToPage={goToPage} />} id={PAGES.CHOOSE_CLAIM_NETWORK} />
          <SmoothPager.Page component={<ClaimingRewards />} id={PAGES.CLAIMING_REWARDS} />
        </SmoothPager>
      </Box>
      <TapToDismiss />
    </>
  );
};

const CLAIM_NETWORKS = [ChainId.optimism, ChainId.base, ChainId.zora];

const ChooseClaimNetwork = ({ goBack, goToPage }: { goBack: () => void; goToPage: (id: string) => void }) => {
  const { highContrastAccentColor } = useAccountAccentColor();

  const networkListItems = useMemo(() => {
    const claimFees = {
      [ChainId.optimism]: 'Free to Claim',
      [ChainId.base]: '$0.08 to Bridge',
      [ChainId.zora]: '$0.10 to Bridge',
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
      goToPage(PAGES.CLAIMING_REWARDS);
      // goBack();
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
            Choose Claim Network
          </Text>
        </TextShadow>
      }
      animatedAccentColor={animatedAccentColor}
      goBack={goBack}
      items={networkListItems}
      onSelect={handleOnSelect}
      pageTitle="Choose Claim Network"
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

const ClaimingRewards = () => {
  const { highContrastAccentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();

  const unclaimedRewardsNativeCurrency = '$375.36';

  return (
    <Panel>
      <ListHeader
        TitleComponent={
          <TextShadow shadowOpacity={0.3}>
            <Text align="center" color={{ custom: highContrastAccentColor }} size="20pt" weight="heavy">
              Claiming on Optimism
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
