import React from 'react';
import { ImageSourcePropType } from 'react-native';

import { Box, Stack, Text, useForegroundColor } from '@/design-system';
import styled from '@/styled-thing';
import { Icon } from '../icons';
import { deviceUtils } from '@/utils';
import { ButtonPressAnimation } from '../animations';
import { ImgixImage } from '../images';
import { Source } from 'react-native-fast-image';
import { TextColor } from '@/design-system/color/palettes';

const CaretIcon = styled(Icon).attrs(({ color }: { color: string }) => ({
  name: 'caret',
  color: color,
}))({
  marginBottom: 5.25,
});

export type AddWalletItem = {
  title: string;
  description: string;
  descriptionColor?: TextColor;
  icon: string | ImageSourcePropType;
  iconColor?: string;
  testID?: string;
  onPress: () => void;
};

type AddWalletRowProps = {
  content: AddWalletItem;
  totalHorizontalInset: number;
};

export const AddWalletRow = ({ content, totalHorizontalInset }: AddWalletRowProps) => {
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const { title, description, icon, descriptionColor, testID, onPress } = content;

  // device width - 2 * total horizontal inset from device boundaries - caret column width (30)
  const contentWidth = deviceUtils.dimensions.width - 2 * totalHorizontalInset - 30;

  const size = 64;

  return (
    <Box
      as={ButtonPressAnimation}
      scaleTo={0.9}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      onPress={onPress}
      testID={testID}
    >
      <Box width={{ custom: contentWidth }}>
        <Stack space="16px" alignHorizontal="left">
          <Box
            as={ImgixImage}
            borderRadius={size / 2}
            height={{ custom: size }}
            marginLeft={{ custom: -12 }}
            marginRight={{ custom: -12 }}
            marginTop={{ custom: -12 }}
            marginBottom={{ custom: -12 }}
            source={icon as Source}
            width={{ custom: size }}
            size={size}
          />
          <Text size="20pt" weight="heavy" color="label">
            {title}
          </Text>
          <Text size="15pt" weight="semibold" color={descriptionColor || 'labelTertiary'}>
            {description}
          </Text>
        </Stack>
      </Box>
      <CaretIcon color={labelQuaternary} />
    </Box>
  );
};
