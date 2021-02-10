import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Dimensions, LayoutAnimation, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import styled from 'styled-components';
import ChartContext from '../../react-native-animated-charts/src/helpers/ChartContext';
import { ButtonPressAnimation } from '../animations';
import FloatingEmojis from '../floating-emojis/FloatingEmojis';
import FloatingEmojisTapHandler from '../floating-emojis/FloatingEmojisTapHandler';
import { Icon } from '../icons';
import { Column, Row } from '../layout';
import { Text } from '../text';
import {
  ChartDot,
  ChartPath,
  ChartPathProvider,
  monotoneCubicInterpolation,
} from '@rainbow-me/animated-charts';
import { useAccountSettings, useGas } from '@rainbow-me/hooks';
import { parseTxFees } from '@rainbow-me/parsers';
import { ethUnits } from '@rainbow-me/references';
import { fonts, fontWithWidth } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

export const StrategyShadow = color => [
  [0, 2, 5, color, 0.2],
  [0, 6, 10, color, 0.14],
  [0, 1, 18, color, 0.12],
];

const StyledLabel = styled(ChartLabel)`
  ${fontWithWidth(fonts.weight.bold)};
  background-color: ${({ theme: { colors } }) => colors.white};
  font-size: ${fonts.size.medium};
  font-variant: tabular-nums;
  margin-horizontal: 30;
  letter-spacing: ${fonts.letterSpacing.roundedTightest};
  text-align: left;
  position: absolute;
`;

const BoxWrapper = styled(ButtonPressAnimation)`
  height: 100;
  flex: 1;
  margin-horizontal: 12;
`;

const Spacer = styled.View`
  height: 2;
`;

const BoxInnerWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const slowEmojis = [
  'face_without_mouth',
  'snail',
  'hourglass_not_done',
  'shopping_cart',
  'tractor',
  'canoe',
  'tired_face',
];

const fastEmojis = [
  'unicorn',
  'motorway',
  'railway_track',
  'police_car_light',
  'airplane',
  'rocket',
  'fire',
  'sports_medal',
];

const normalEmojis = [
  'blossom',
  'man_walking',
  'woman_walking',
  'ship',
  'timer_clock',
  'rainbow',
  'star',
];

const FastPriceBox = styled(PriceBox).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  emojis: fastEmojis,
  text: 'fast',
}))``;

const NormalPriceBox = styled(PriceBox).attrs(({ theme: { colors } }) => ({
  color: colors.yellowOrange,
  emojis: normalEmojis,
  text: 'normal',
}))``;

const SlowPriceBox = styled(PriceBox).attrs(({ theme: { colors } }) => ({
  color: colors.chartGreen,
  emojis: slowEmojis,
  text: 'slow',
}))``;

function SpeedFloatingEmojis({ emojis, children }) {
  return (
    <FloatingEmojis
      distance={350}
      duration={2000}
      emojis={emojis}
      size={36}
      wiggleFactor={0}
    >
      {({ onNewEmoji }) => (
        <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
          {children}
        </FloatingEmojisTapHandler>
      )}
    </FloatingEmojis>
  );
}
export const { width: SIZE } = Dimensions.get('window');

function formatGwei(value) {
  'worklet';
  if (value === '' || value === undefined) {
    return '';
  }
  return `${Number(value).toFixed(0)} Gwei`;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function ChartLabel(props) {
  const { originalX = 0, originalY = 0 } = useContext(ChartContext);
  const formattedValue = useDerivedValue(() => {
    const formattedGwei = formatGwei(originalY.value);
    if (formattedGwei === '') {
      return '';
    }
    return `${Number(originalX.value) < 10 ? 0 : ''}${Number(
      originalX.value
    ).toFixed(0)}% in less than ${formattedGwei}`;
  }, []);
  const textProps = useAnimatedStyle(() => {
    return {
      text: formattedValue.value,
    };
  }, []);
  return (
    <AnimatedTextInput
      {...props}
      animatedProps={textProps}
      defaultValue={formatGwei(originalX.value)}
      editable={false}
    />
  );
}

function Chart() {
  const { colors } = useTheme();
  const { percentiles } = useGas();
  const percentilesPoints = useMemo(() => {
    return percentiles
      ? Object.entries(percentiles)
          .reduce((acc, [key, value]) => {
            if (key !== '100') {
              acc.push({ x: Number(key), y: value });
            }
            return acc;
          }, [])
          .sort((a, b) => a.x - b.x)
      : [];
  }, [percentiles]);

  const smoothPercentilesPoints = useMemo(
    () =>
      monotoneCubicInterpolation({
        data: percentilesPoints,
        range: 40,
      }),
    []
  );
  return (
    <View>
      <ChartPathProvider
        data={{
          nativePoints: percentilesPoints,
          points: smoothPercentilesPoints,
          smoothingStrategy: 'bezier',
        }}
      >
        <StyledLabel />
        <ChartPath
          fill="none"
          hapticsEnabled
          height={SIZE / 3}
          hitSlop={30}
          longPressGestureHandlerProps={{
            minDurationMs: 60,
          }}
          selectedStrokeWidth={3}
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3.5}
          width={SIZE}
        />
        <ChartDot
          style={{
            backgroundColor: colors.black,
          }}
        />
      </ChartPathProvider>
    </View>
  );
}

function PriceBox({
  color,
  emojis,
  value: { display: amount },
  text,
  estimatedTime: { display: estimatedTime },
  fee: {
    txFee: {
      native: {
        value: { display: nativeFee },
      },
    },
  },
}) {
  const shadows = useMemo(() => StrategyShadow(color), [color]);
  const { colors } = useTheme();
  return (
    <BoxWrapper>
      <SpeedFloatingEmojis emojis={emojis}>
        <ShadowStack
          backgroundColor={color}
          borderRadius={12}
          shadows={shadows}
          style={{
            height: 80,
            width: 80,
          }}
        >
          <BoxInnerWrapper>
            <Text color={colors.white} size="small">
              {text}
            </Text>

            <Text color={colors.white} size="big" weight="bold">
              {amount.split(' ')[0]}
            </Text>
            <Text color={colors.white} size="small" weight="bold">
              gwei
            </Text>
            <Spacer />
            <Text color={colors.white} size="small">
              {estimatedTime} {nativeFee}
            </Text>
          </BoxInnerWrapper>
        </ShadowStack>
      </SpeedFloatingEmojis>
    </BoxWrapper>
  );
}

export default function GasSection() {
  const [percentilesVisible, setPercentilesVisible] = useState(false);
  const { gasPrices, startPollingGasPrices, stopPollingGasPrices } = useGas();
  useEffect(() => {
    startPollingGasPrices();
    return stopPollingGasPrices;
  }, [startPollingGasPrices, stopPollingGasPrices]);

  const toggleChart = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    setPercentilesVisible(prev => !prev);
  });

  const ethPriceUnit = ethereumUtils.getEthPriceUnit();

  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();

  const {
    fast: nativeFast,
    normal: nativeNormal,
    slow: nativeSlow,
  } = useMemo(
    () =>
      parseTxFees(gasPrices, ethPriceUnit, ethUnits.basic_tx, nativeCurrency),
    [ethPriceUnit, gasPrices, nativeCurrency]
  );

  const { fast, normal, slow } = gasPrices;

  return fast ? (
    <Column marginTop={20}>
      <Row marginBottom={10} paddingHorizontal={22}>
        <Text marginLeft={10} size="larger" weight="bold">
          ⛽ Estimated Gas Prices
        </Text>
      </Row>
      <Row marginBottom={10} paddingHorizontal={22}>
        <SlowPriceBox {...slow} fee={nativeSlow} />
        <NormalPriceBox {...normal} fee={nativeNormal} />
        <FastPriceBox {...fast} fee={nativeFast} />
      </Row>
      <Row marginBottom={10} paddingHorizontal={32}>
        <ButtonPressAnimation onPress={toggleChart}>
          <Text marginLeft={10} size="larger" weight="bold">
            Percentiles {percentilesVisible ? '' : '􀯼'}
            {percentilesVisible && (
              <Icon color={colors.black} name="close" top="-4" />
            )}
          </Text>
        </ButtonPressAnimation>
      </Row>
      {percentilesVisible && <Chart />}
    </Column>
  ) : null;
}
