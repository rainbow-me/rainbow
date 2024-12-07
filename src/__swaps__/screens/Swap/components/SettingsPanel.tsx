import React from 'react';
import Animated, { useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { ChainContextMenu } from '@/components/context-menu-buttons/ChainContextMenu';
import { Bleed, Border, Box, Column, Columns, Separator, Stack, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { opacity } from '@/__swaps__/utils/swaps';
import { THICK_BORDER_WIDTH } from '../constants';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { AnimatedSwitch } from './AnimatedSwitch';
import { GestureHandlerButton } from './GestureHandlerButton';
import { SlippageRow } from './ReviewPanel';

const PreferredNetworkMenu = () => {
  const preferredNetwork = useSwapsStore(state => state.preferredNetwork);

  return (
    <ChainContextMenu
      allNetworksIcon={{ color: 'labelSecondary', icon: '􀒙', name: 'bolt.horizontal.circle', weight: 'bold' }}
      allNetworksText={i18n.t(i18n.l.expanded_state.swap_details_v2.automatic)}
      defaultButtonOptions={{ iconColor: 'labelTertiary' }}
      onSelectChain={chain => useSwapsStore.setState({ preferredNetwork: chain })}
      selectedChainId={preferredNetwork}
    />
  );
};

export function SettingsPanel() {
  const { isDarkMode } = useColorMode();
  const { SwapSettings, configProgress, swapInfo } = useSwapContext();

  const separator = useForegroundColor('separator');

  const degenSettingsVisibilityStyle = useAnimatedStyle(() => {
    return {
      display: swapInfo.value.areBothAssetsSet && SwapSettings.degenMode.value ? 'flex' : 'none',
    };
  });

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_SETTINGS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_SETTINGS ? 'none' : 'auto',
      opacity:
        configProgress.value === NavigationSteps.SHOW_SETTINGS
          ? withDelay(120, withSpring(1, SPRING_CONFIGS.springConfig))
          : withSpring(0, SPRING_CONFIGS.springConfig),
    };
  });

  return (
    <Box
      alignItems="center"
      as={Animated.View}
      gap={28}
      style={[styles, { flex: 1 }]}
      testID="swap-settings-panel"
      width="full"
      zIndex={12}
    >
      <Text align="center" color="label" size="20pt" weight="heavy">
        {i18n.t(i18n.l.expanded_state.swap_details_v2.settings)}
      </Text>

      <GestureHandlerButton onPressWorklet={SwapSettings.onToggleDegenMode} scaleTo={0.97}>
        <Box
          background={isDarkMode ? 'fillQuaternary' : 'fillTertiary'}
          borderRadius={20}
          flexDirection="row"
          gap={28}
          justifyContent="space-between"
          padding="20px"
          paddingRight="16px"
          width="full"
        >
          <Stack space="12px">
            <Text color="label" size="17pt" weight="heavy">
              {i18n.t(i18n.l.expanded_state.swap_details_v2.degen_mode)}
            </Text>
            <Text color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.expanded_state.swap_details_v2.degen_mode_description)}
            </Text>
          </Stack>

          <Bleed top="4px">
            <AnimatedSwitch onToggle={SwapSettings.onToggleDegenMode} size="large" value={SwapSettings.degenMode} />
          </Bleed>

          <Border
            borderColor={isDarkMode ? 'separatorSecondary' : 'separatorTertiary'}
            borderRadius={20}
            borderWidth={THICK_BORDER_WIDTH}
            enableInLightMode
          />
        </Box>
      </GestureHandlerButton>

      <Box gap={28} paddingHorizontal="12px" width="full">
        <Animated.View style={[degenSettingsVisibilityStyle, { gap: 28 }]}>
          <SlippageRow />
          <Separator color={{ custom: opacity(separator, 0.03) }} thickness={THICK_BORDER_WIDTH} />
        </Animated.View>

        <Columns space="10px" alignVertical="center" alignHorizontal="justify">
          <Column>
            <Box alignItems="center" flexDirection="row" gap={12}>
              <TextIcon color="labelTertiary" height={9} size="icon 13px" weight="bold" width={16}>
                􀤆
              </TextIcon>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                {i18n.t(i18n.l.expanded_state.swap_details_v2.preferred_network)}
              </Text>
            </Box>
          </Column>

          <Column width="content">
            <PreferredNetworkMenu />
          </Column>
        </Columns>

        <Separator color={{ custom: opacity(separator, 0.03) }} thickness={THICK_BORDER_WIDTH} />
      </Box>
    </Box>
  );
}
