import { Box, Stack, Text, useForegroundColor } from '@/design-system';
import { IS_ANDROID, IS_TEST } from '@/env';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import React from 'react';
import { GradientText, Text as RNText } from '../text';
import { Icon } from '../icons';
import ConditionalWrap from 'conditional-wrap';
import { deviceUtils } from '@/utils';
import { ButtonPressAnimation } from '../animations';

const RainbowText = styled(GradientText).attrs(
  ({ theme: { colors } }: any) => ({
    angle: false,
    colors: colors.gradients.rainbow,
    end: { x: 0, y: 0.5 },
    start: { x: 1, y: 0.5 },
    steps: [0, 0.774321, 1],
  })
)({});

const TextIcon = styled(RNText).attrs({
  size: 29,
  weight: 'medium',
})({
  marginVertical: IS_ANDROID ? -10 : 0,
});

const CaretIcon = styled(Icon).attrs(({ color }: { color: string }) => ({
  name: 'caret',
  color: color,
}))({
  marginBottom: 5.25,
});

export type AddWalletItem = {
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  testID?: string;
  onPress: () => void;
};

type AddWalletRowProps = {
  content: AddWalletItem;
  totalHorizontalInset: number;
};

export const AddWalletRow = ({
  content,
  totalHorizontalInset,
}: AddWalletRowProps) => {
  const { colors } = useTheme();
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const { title, description, icon, iconColor, testID, onPress } = content;

  // device width - 2 * total horizontal inset from device boundaries - caret column width (30)
  const contentWidth =
    deviceUtils.dimensions.width - 2 * totalHorizontalInset - 30;

  const shouldUseRainbowText = !iconColor && !(IS_ANDROID && IS_TEST);

  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-ignore js component
      scaleTo={0.9}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      onPress={onPress}
      testID={testID}
    >
      <Box width={{ custom: contentWidth }}>
        <Stack space="12px" alignHorizontal="left">
          <ConditionalWrap
            condition={shouldUseRainbowText}
            wrap={(children: React.ReactNode) => (
              <RainbowText colors={colors}>{children}</RainbowText>
            )}
          >
            <TextIcon color={iconColor}>{icon}</TextIcon>
          </ConditionalWrap>
          <ConditionalWrap
            condition={shouldUseRainbowText}
            wrap={(children: React.ReactNode) => (
              <Box marginBottom={{ custom: -4 }}>
                <RainbowText colors={colors}>
                  <Box marginBottom={{ custom: 4 }}>{children}</Box>
                </RainbowText>
              </Box>
            )}
          >
            <Text size="20pt" weight="bold" color="label">
              {title}
            </Text>
          </ConditionalWrap>
          <Text size="13pt" weight="semibold" color="labelTertiary">
            {description}
          </Text>
        </Stack>
      </Box>
      <CaretIcon color={labelQuaternary} />
    </Box>
  );
};
