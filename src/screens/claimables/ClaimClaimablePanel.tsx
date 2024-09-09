import React, { useCallback, useMemo, useState } from 'react';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { AccentColorProvider, Bleed, Box, Inline, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, ListPanel, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId, ChainNameDisplay } from '@/networks/types';
import { useAccountSettings } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Claimable } from '@/resources/addys/claimables/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { FasterImageView } from '@candlefinance/faster-image';
import { ContextMenuButton } from '@/components/context-menu';
import { useClaimables } from '@/resources/addys/claimables/query';

const CLAIM_NETWORKS = [ChainId.base, ChainId.optimism, ChainId.zora];

const PAGES = {
  CHOOSE_CLAIM_NETWORK: 'choose-claim-network',
  CLAIMING_CLAIMABLE: 'claiming-claimable',
};

type RouteParams = {
  ClaimClaimablePanelParams: { uniqueId: string };
};

export const ClaimClaimablePanel = () => {
  const {
    params: { uniqueId },
  } = useRoute<RouteProp<RouteParams, 'ClaimClaimablePanelParams'>>();
  const { goBack, goToPage, ref } = usePagerNavigation();

  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { data = [] } = useClaimables(
    {
      address: accountAddress,
      currency: nativeCurrency,
    },
    {
      select: data => data?.filter(claimable => claimable.uniqueId === uniqueId),
    }
  );

  const [claimable] = data;

  const [selectedChainId, setSelectedChainId] = useState<ChainId>(ChainId.base); // default to chainId of claimable

  if (!claimable) return null;

  return (
    <>
      <Box style={[controlPanelStyles.panelContainer, { bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30) }]}>
        <SmoothPager enableSwipeToGoBack initialPage={PAGES.CHOOSE_CLAIM_NETWORK} ref={ref}>
          <SmoothPager.Page
            component={<ChooseClaimNetwork claimable={claimable} goBack={goBack} goToPage={goToPage} selectChainId={setSelectedChainId} />}
            id={PAGES.CHOOSE_CLAIM_NETWORK}
          />
          <SmoothPager.Page
            component={<ClaimingClaimable claimable={claimable} goBack={goBack} chainId={selectedChainId} />}
            id={PAGES.CLAIMING_CLAIMABLE}
          />
        </SmoothPager>
      </Box>
      <TapToDismiss />
    </>
  );
};

const NETWORK_LIST_ITEMS = CLAIM_NETWORKS.map(chainId => {
  return {
    IconComponent: <ChainImage chainId={chainId} size={36} />,
    label: ChainNameDisplay[chainId],
    uniqueId: chainId.toString(),
    selected: false,
  };
});

const ChooseClaimNetwork = ({
  claimable,
  goBack,
  goToPage,
  selectChainId,
}: {
  claimable: Claimable;
  goBack: () => void;
  goToPage: (id: string) => void;
  selectChainId: (chainId: ChainId) => void;
}) => {
  const { isDarkMode } = useColorMode();

  const handleOnSelect = useCallback(
    (selectedItemId: string) => {
      selectChainId(parseInt(selectedItemId) as ChainId);
      goToPage(PAGES.CLAIMING_CLAIMABLE);
    },
    [goToPage, selectChainId]
  );

  return (
    <ListPanel
      TitleComponent={
        <Box alignItems="center" flexDirection="row" gap={10} justifyContent="center">
          <Box
            as={FasterImageView}
            source={{ url: claimable.iconUrl }}
            style={{ height: 20, width: 20, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.03)' }}
          />
          <TextShadow shadowOpacity={0.3}>
            <Text align="center" color="label" size="20pt" weight="heavy">
              {'Claim'}
            </Text>
          </TextShadow>
        </Box>
      }
      disableSelectedStyle
      goBack={goBack}
      items={NETWORK_LIST_ITEMS}
      onSelect={handleOnSelect}
      pageTitle={'Claim'}
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

const ClaimingClaimable = ({ chainId, claimable, goBack }: { chainId: ChainId; claimable: Claimable; goBack: () => void }) => {
  const { isDarkMode } = useColorMode();
  const theme = useTheme();

  const menuConfig = useMemo(() => {
    return {
      menuItems: {},
    };
  }, []);

  const onShowActionSheet = useCallback(() => {}, []);

  const chainName = ChainNameDisplay[chainId];

  return (
    <Panel>
      <ListHeader
        BackButtonComponent={
          <TextShadow shadowOpacity={0.3}>
            <Text align="center" color="label" size="icon 20px" weight="bold">
              􀆉
            </Text>
          </TextShadow>
        }
        TitleComponent={
          <Box alignItems="center" flexDirection="row" gap={10} justifyContent="center">
            <Box
              as={FasterImageView}
              source={{ url: claimable.iconUrl }}
              style={{ height: 20, width: 20, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.03)' }}
            />
            <TextShadow shadowOpacity={0.3}>
              <Text align="center" color="label" size="20pt" weight="heavy">
                {'Claim'}
              </Text>
            </TextShadow>
          </Box>
        }
        goBack={goBack}
        showBackButton
      />

      <Box alignItems="center" paddingTop="44px" paddingBottom="24px" gap={36}>
        <Box alignItems="center" gap={20}>
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
                <RainbowCoinIcon size={40} icon={claimable.iconUrl} chainId={1} symbol={'MOXIE'} theme={theme} colors={undefined} />
              </View>
            </Bleed>
            <TextShadow blur={12} color={globalColors.grey100} shadowOpacity={0.1} y={4}>
              <Text align="center" color="label" size="44pt" weight="black">
                {claimable.value.nativeAsset.display}
              </Text>
            </TextShadow>
          </Box>
          <Inline space={{ custom: 5 }} alignVertical="center">
            <TextShadow shadowOpacity={0.3}>
              <Text align="center" color="labelTertiary" size="17pt" weight="bold">
                {'Receive'}
              </Text>
            </TextShadow>
            <ContextMenuButton
              hitSlop={20}
              menuItems={menuConfig.menuItems}
              menuTitle=""
              onPressMenuItem={() => {}}
              onPressAndroid={onShowActionSheet}
              testID={undefined}
            >
              <Box
                height={{ custom: 28 }}
                paddingHorizontal={{ custom: 7 }}
                alignItems="center"
                justifyContent="center"
                borderRadius={12}
                borderWidth={1.33}
                style={{ backgroundColor: 'rgba(9, 17, 31, 0.02)' }}
                borderColor={{ custom: 'rgba(9, 17, 31, 0.02)' }}
              >
                <Inline alignVertical="center" space="4px" wrap={false}>
                  <Text align="center" color="label" size="17pt" weight="heavy">
                    {'USDC'}
                  </Text>
                  <Text align="center" color="labelSecondary" size="icon 12px" weight="heavy">
                    􀆏
                  </Text>
                </Inline>
              </Box>
            </ContextMenuButton>
            <TextShadow shadowOpacity={0.3}>
              <Text align="center" color="labelTertiary" size="17pt" weight="bold">
                {'on'}
              </Text>
            </TextShadow>
            <ContextMenuButton
              hitSlop={20}
              menuItems={menuConfig.menuItems}
              menuTitle=""
              onPressMenuItem={() => {}}
              onPressAndroid={onShowActionSheet}
              testID={undefined}
            >
              <Box
                height={{ custom: 28 }}
                paddingHorizontal={{ custom: 7 }}
                alignItems="center"
                justifyContent="center"
                borderRadius={12}
                borderWidth={1.33}
                style={{ backgroundColor: 'rgba(9, 17, 31, 0.02)' }}
                borderColor={{ custom: 'rgba(9, 17, 31, 0.02)' }}
              >
                <Inline alignVertical="center" space="4px" wrap={false}>
                  <Text align="center" color="label" size="17pt" weight="heavy">
                    {chainName}
                  </Text>
                  <Text align="center" color="labelSecondary" size="icon 12px" weight="heavy">
                    􀆏
                  </Text>
                </Inline>
              </Box>
            </ContextMenuButton>
          </Inline>
        </Box>
        <Box gap={20} alignItems="center" width="full">
          <ButtonPressAnimation style={{ width: '100%', paddingHorizontal: 18 }} scaleTo={0.96}>
            <AccentColorProvider color="#295AF7">
              <Box
                background="accent"
                shadow="30px accent"
                borderRadius={43}
                height={{ custom: 48 }}
                width="full"
                alignItems="center"
                justifyContent="center"
              >
                <Inline alignVertical="center" space="6px">
                  <TextShadow shadowOpacity={0.3}>
                    <Text align="center" color="label" size="icon 20px" weight="heavy">
                      􀎽
                    </Text>
                  </TextShadow>
                  <TextShadow shadowOpacity={0.3}>
                    <Text align="center" color="label" size="20pt" weight="heavy">
                      {`Claim ${claimable.value.claimAsset.display}`}
                    </Text>
                  </TextShadow>
                </Inline>
              </Box>
            </AccentColorProvider>
          </ButtonPressAnimation>
          <Inline alignVertical="center" space="2px">
            <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
              􀵟
            </Text>
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {`$0.01 to claim on ${chainName}`}
            </Text>
          </Inline>
        </Box>
      </Box>
    </Panel>
  );
};
