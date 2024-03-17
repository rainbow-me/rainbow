import c from 'chroma-js';
import React, { useMemo } from 'react';
import { Text as RNText, ScrollView, StyleSheet } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, HitSlop, Inline, Separator, Stack, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { useAccountAccentColor, useDimensions } from '@/hooks';
import { Network } from '@/networks/types';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from './SwapCoinIcon';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../constants';
import { DAI_ADDRESS, ETH_ADDRESS, USDC_ADDRESS } from '../dummyValues';
import { opacity } from '../utils';
import { CoinRow } from './CoinRow';
import { SearchInput } from './SearchInput';

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
                    My Tokens
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
            <CoinRow
              address={ETH_ADDRESS}
              balance="7"
              isTrending={output}
              name="Ethereum"
              nativeBalance="$18,320"
              output={output}
              symbol="ETH"
            />
            <CoinRow
              address={USDC_ADDRESS}
              balance="2,640"
              isTrending={output}
              name="USD Coin"
              nativeBalance="$2,640"
              output={output}
              symbol="USDC"
            />
            <CoinRow
              address={DAI_ADDRESS}
              balance="2,800.02"
              isTrending={output}
              name="Dai"
              nativeBalance="$2,800"
              output={output}
              symbol="DAI"
            />
          </Stack>
          <Stack space="20px">
            {output && (
              <Inline alignVertical="center" space="6px">
                <Bleed vertical="4px">
                  <Box alignItems="center" justifyContent="center" width={{ custom: 16 }}>
                    <Bleed space={isDarkMode ? '16px' : undefined}>
                      <RNText
                        style={
                          isDarkMode
                            ? [
                                styles.textIconGlow,
                                {
                                  textShadowColor: opacity(blue, 0.28),
                                },
                              ]
                            : undefined
                        }
                      >
                        <Text align="center" color="blue" size="icon 13px" weight="heavy">
                          􀐫
                        </Text>
                      </RNText>
                    </Bleed>
                  </Box>
                </Bleed>
                <Text color="label" size="15pt" weight="heavy">
                  Recent
                </Text>
              </Inline>
            )}
            <CoinRow
              address="0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"
              balance="428.25"
              name="Aave"
              nativeBalance="$1,400"
              output={output}
              symbol="AAVE"
            />
            <CoinRow
              address="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
              balance="0.042819"
              name="Wrapped Bitcoin"
              nativeBalance="$1,025"
              output={output}
              symbol="WBTC"
            />
            <CoinRow
              address="0xc00e94cb662c3520282e6f5717214004a7f26888"
              balance="72.2806"
              name="Compound"
              nativeBalance="$350.04"
              output={output}
              symbol="COMP"
            />
            <CoinRow
              address="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
              balance="62.82"
              name="Uniswap"
              nativeBalance="$289.52"
              output={output}
              symbol="UNI"
            />
            <CoinRow
              address="0x514910771af9ca656af840dff83e8264ecf986ca"
              balance="27.259"
              name="Chainlink"
              nativeBalance="$87.50"
              output={output}
              symbol="LINK"
            />
          </Stack>
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
