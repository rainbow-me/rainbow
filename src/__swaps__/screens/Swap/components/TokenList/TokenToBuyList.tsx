import { Text as RNText, StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import React, { useMemo } from 'react';
import { useAssetsToBuySections } from '../../hooks/useAssetsToBuy';
import { TokenToBuySection } from './TokenToBuySection';
import { Bleed, Box, HitSlop, Inline, Stack, Text, useColorMode, useForegroundColor } from '@/design-system';
import { useSwapAssetStore } from '../../state/assets';
import { isL2Chain } from '../../utils/chains';
import { opacity } from '../../utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { SwapCoinIcon } from '../SwapCoinIcon';
import { ETH_ADDRESS } from '../../dummyValues';
import { Network } from '@/helpers';
import { useTheme } from '@/theme';

export const TokenToBuyList = () => {
  const { isDarkMode } = useColorMode();
  const { outputChainId } = useSwapAssetStore();
  const sections = useAssetsToBuySections();
  const red = useForegroundColor('red');
  const theme = useTheme();

  const isL2 = useMemo(() => outputChainId && isL2Chain(outputChainId), [outputChainId]);

  const assetsCount = useMemo(() => sections?.reduce((count, section) => count + section.data.length, 0), [sections]);

  return (
    <Stack space="32px">
      <Stack space="20px">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline alignVertical="center" space="6px">
            <Bleed vertical="4px">
              <Box alignItems="center" justifyContent="center" marginBottom={{ custom: -0.5 }} width={{ custom: 16 }}>
                <Bleed space={isDarkMode ? '16px' : undefined}>
                  <RNText
                    style={
                      isDarkMode
                        ? [
                            styles.textIconGlow,
                            {
                              textShadowColor: opacity(red, 0.28),
                            },
                          ]
                        : undefined
                    }
                  >
                    <Text align="center" color="labelSecondary" size="icon 13px" weight="heavy">
                      􀆪
                    </Text>
                  </RNText>
                </Bleed>
              </Box>
            </Bleed>
            <Text color="labelSecondary" size="15pt" weight="heavy">
              Filter by Network
            </Text>
          </Inline>
          {/* TODO: Add dropdown menu for network selection. Should set `outputChainId` */}
          <ButtonPressAnimation>
            <HitSlop space="10px">
              <Inline alignVertical="center" space="6px" wrap={false}>
                <SwapCoinIcon
                  mainnetAddress={ETH_ADDRESS}
                  address={ETH_ADDRESS}
                  network={Network.mainnet}
                  small
                  symbol="ETH"
                  theme={theme}
                />
                <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                  Ethereum
                </Text>
                <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
                  􀆏
                </Text>
              </Inline>
            </HitSlop>
          </ButtonPressAnimation>
        </Inline>
      </Stack>
      {sections.map(section => (
        <TokenToBuySection key={section.id} section={section} />
      ))}

      {!assetsCount && (
        <Box alignItems="center" style={{ paddingTop: 91 }}>
          <Box paddingHorizontal="44px">
            <Stack space="16px">
              <Text color="label" size="26pt" weight="bold" align="center">
                {'👻'}
              </Text>

              <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
                {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
              </Text>

              <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
                {i18n.t(i18n.l.swap.tokens_input[isL2 ? 'nothing_found_description_l2' : 'nothing_found_description'], {
                  action: 'swap',
                })}
              </Text>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
