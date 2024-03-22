import c from 'chroma-js';
import React, { useMemo } from 'react';
import { Text as RNText, ScrollView, StyleSheet } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, HitSlop, Inline, Separator, Stack, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { useAccountAccentColor, useDimensions } from '@/hooks';
import { Network } from '@/networks/types';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from '../SwapCoinIcon';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { DAI_ADDRESS, ETH_ADDRESS, USDC_ADDRESS } from '../../dummyValues';
import { opacity } from '../../utils/swaps';
import { CoinRow } from '../CoinRow';
import { SearchInput } from '../SearchInput';
import { TokenToSellList } from './TokenToSellList';
import { TokenToBuyList } from './TokenToBuyList';

export const TokenList = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  isFocused,
  output,
  setIsFocused,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  isFocused: boolean;
  output?: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { accentColor: accountColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const theme = useTheme();

  const blue = useForegroundColor('blue');
  const red = useForegroundColor('red');

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  return (
    <Stack>
      <Stack space="20px">
        <SearchInput
          color={color}
          handleExitSearch={handleExitSearch}
          handleFocusSearch={handleFocusSearch}
          isFocused={isFocused}
          output={output}
          setIsFocused={setIsFocused}
        />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT + 20 : 20,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
        style={{
          alignSelf: 'center',
          height: EXPANDED_INPUT_HEIGHT - 77,
          paddingHorizontal: 20,
          width: deviceWidth - 24,
        }}
      >
        <Stack space={output ? '28px' : '20px'}>
          <Stack space="20px">
            <Inline alignHorizontal="justify" alignVertical="center">
              {output ? (
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
                          <Text align="center" color="red" size="icon 13px" weight="heavy">
                            􀙬
                          </Text>
                        </RNText>
                      </Bleed>
                    </Box>
                  </Bleed>
                  <Text color="label" size="15pt" weight="heavy">
                    Trending
                  </Text>
                </Inline>
              ) : (
                <Inline alignVertical="center" space="6px">
                  <Bleed vertical="4px">
                    <Box alignItems="center" justifyContent="center" width={{ custom: 18 }}>
                      <Bleed space={isDarkMode ? '16px' : undefined}>
                        <RNText
                          style={
                            isDarkMode
                              ? [
                                  styles.textIconGlow,
                                  {
                                    textShadowColor: opacity(accentColor, 0.2),
                                  },
                                ]
                              : undefined
                          }
                        >
                          <Text align="center" color={{ custom: accentColor }} size="icon 13px" weight="black">
                            􀣽
                          </Text>
                        </RNText>
                      </Bleed>
                    </Box>
                  </Bleed>
                  <Text color="label" size="15pt" weight="heavy">
                    My tokens
                  </Text>
                </Inline>
              )}
              <ButtonPressAnimation>
                <HitSlop space="10px">
                  <Inline alignVertical="center" space="6px" wrap={false}>
                    {output && <SwapCoinIcon address={ETH_ADDRESS} network={Network.mainnet} small symbol="ETH" theme={theme} />}
                    <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                      {output ? 'Ethereum' : 'All Networks'}
                    </Text>
                    <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
                      􀆏
                    </Text>
                  </Inline>
                </HitSlop>
              </ButtonPressAnimation>
            </Inline>
          </Stack>
          {!output && <TokenToSellList />}
          {output && <TokenToBuyList />}
        </Stack>
      </ScrollView>
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
