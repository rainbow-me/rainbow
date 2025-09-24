import { View } from 'react-native';
import { memo } from 'react';
import { Box, Text, TextIcon, useForegroundColor } from '@/design-system';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { PerpMarket } from '@/features/perps/types';
import { DEFAULT_SLIPPAGE_BIPS } from '@/features/perps/constants';
import { mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';

interface RowProps {
  children: React.ReactNode;
  highlighted?: boolean | SharedValue<boolean>;
}

export function Row({ children, highlighted }: RowProps) {
  const fill = useForegroundColor('fill');
  const separator = useForegroundColor('separator');

  const containerStyle = useAnimatedStyle(() => {
    const isHighlighted = typeof highlighted === 'object' ? highlighted.value : highlighted;
    const colorForBackground = opacityWorklet(fill, 0.025);
    const colorForBorder = opacityWorklet(separator, 0.01);

    return {
      backgroundColor: isHighlighted ? colorForBackground : 'transparent',
      borderColor: isHighlighted ? colorForBorder : 'transparent',
    };
  });

  return (
    <Animated.View style={[{ borderWidth: THICK_BORDER_WIDTH, borderRadius: 14, height: 36 }, containerStyle]}>
      <Box height="full" alignItems="center" paddingLeft="10px" paddingRight="12px" justifyContent="space-between" flexDirection="row">
        {children}
      </Box>
    </Animated.View>
  );
}

export const DetailsSection = memo(function DetailsSection({ market }: { market: PerpMarket }) {
  return (
    <View>
      <Text size="20pt" weight="bold" color={'labelSecondary'}>
        {'Details'}
      </Text>
      <Box paddingTop={'20px'} gap={4}>
        <Row highlighted={true}>
          <Box flexDirection="row" alignItems="center" gap={12}>
            <TextIcon color="labelSecondary" height={10} size="icon 15px" width={20} weight="medium">
              {'􁎢'}
            </TextIcon>
            <Text color="labelSecondary" size="17pt" weight="medium">
              {'Funding Rate'}
            </Text>
          </Box>
          <Text align="right" color="labelSecondary" size="17pt" weight="semibold">
            {`${toFixedWorklet(mulWorklet(market.fundingRate, 100), 6)}%`}
          </Text>
        </Row>
        <Row highlighted={false}>
          <Box flexDirection="row" alignItems="center" gap={12}>
            <TextIcon color="labelSecondary" height={10} size="icon 15px" width={20} weight="medium">
              {'􀘾'}
            </TextIcon>
            <Text color="labelSecondary" size="17pt" weight="medium">
              {'Max Slippage'}
            </Text>
          </Box>
          <Text align="right" color="labelSecondary" size="17pt" weight="semibold">
            {`${DEFAULT_SLIPPAGE_BIPS / 100}%`}
          </Text>
        </Row>
      </Box>
    </View>
  );
});
