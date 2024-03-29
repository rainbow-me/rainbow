import React from 'react';
import { Source } from 'react-native-fast-image';
import { ButtonPressAnimation } from '../../../components/animations';
import CheckmarkCircledIcon from '../../../components/icons/svg/CheckmarkCircledIcon';
import WarningIcon from '../../../components/icons/svg/WarningIcon';
import Chevron from '@/assets/chevronUpDown.png';
import Caret from '@/assets/family-dropdown-arrow.png';
import { Box, Inline, Stack, Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import { ImageSourcePropType } from 'react-native';
import { Width } from '@/design-system/layout/size';
import { colors } from '@/styles';

interface ImageIconProps {
  size?: number;
  source: ImageSourcePropType | Source | undefined;
}

const ImageIcon = ({ size = 60, source }: ImageIconProps) => (
  <Box
    as={ImgixImage}
    borderRadius={size / 2}
    height={{ custom: size }}
    marginLeft={{ custom: -12 }}
    marginRight={{ custom: -12 }}
    marginTop={{ custom: 8 }}
    source={source as Source}
    width={{ custom: size }}
    size={size}
  />
);

interface TextIconProps {
  icon: string;
  disabled?: boolean;
  isLink?: boolean;
  colorOverride?: string;
  isEmoji?: boolean;
}

const TextIcon = ({ colorOverride, icon, disabled, isLink, isEmoji = false }: TextIconProps) => (
  <Box paddingLeft={{ custom: isEmoji ? 7 : 0 }}>
    <Text
      color={
        colorOverride
          ? { custom: colorOverride }
          : disabled
            ? 'secondary60 (Deprecated)'
            : isLink
              ? 'action (Deprecated)'
              : 'primary (Deprecated)'
      }
      containsEmoji
      size="18px / 27px (Deprecated)"
      weight="semibold"
    >
      {icon}
    </Text>
  </Box>
);

interface SelectionProps {
  children: React.ReactNode;
}

const Selection = ({ children }: SelectionProps) => (
  <Text color="secondary60 (Deprecated)" size="18px / 27px (Deprecated)" weight="semibold">
    {children}
  </Text>
);

type StatusType = 'complete' | 'incomplete' | 'warning' | 'selected';

interface StatusIconProps {
  status: StatusType;
}

const StatusIcon = ({ status }: StatusIconProps) => {
  const { colors, isDarkMode } = useTheme();
  const statusColors: { [key in StatusType]: string } = {
    complete: colors.green,
    incomplete: colors.alpha(colors.blueGreyDark, 0.5),
    selected: colors.appleBlue,
    warning: colors.orangeLight,
  };
  return (
    <Box
      as={status === 'warning' ? WarningIcon : CheckmarkCircledIcon}
      backgroundColor={statusColors[status]}
      color={statusColors[status]}
      colors={colors}
      borderRadius={status !== 'warning' ? 6 : undefined}
      fillColor={colors.white}
      shadowColor={isDarkMode ? colors.shadow : statusColors[status]}
      shadowOffset={{
        height: 4,
        width: 0,
      }}
      elevation={12}
      shadowOpacity={ios ? 0.4 : 1}
      shadowRadius={6}
    />
  );
};

interface TitleProps {
  text: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  disabled?: boolean;
  isLink?: boolean;
  customColor?: string;
}

const Title = ({ text, weight = 'semibold', disabled, isLink, customColor }: TitleProps) => (
  <Text
    color={
      disabled
        ? 'secondary60 (Deprecated)'
        : customColor
          ? { custom: customColor }
          : isLink
            ? 'action (Deprecated)'
            : 'primary (Deprecated)'
    }
    containsEmoji
    size="18px / 27px (Deprecated)"
    weight={weight}
    numberOfLines={1}
  >
    {text}
  </Text>
);

interface LabelProps {
  text: string;
  warn?: boolean;
  color?: string;
}

const Label = ({ text, warn, color }: LabelProps) => {
  const { colors } = useTheme();
  return (
    <Text
      color={color ? { custom: color } : warn ? { custom: colors.orangeLight } : 'secondary60 (Deprecated)'}
      size="14px / 19px (Deprecated)"
      weight="medium"
    >
      {text}
    </Text>
  );
};

interface MenuItemProps {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  size?: 52 | 60 | number;
  hasRightArrow?: boolean;
  onPress?: () => void;
  width?: Width;
  titleComponent: React.ReactNode;
  labelComponent?: React.ReactNode;
  disabled?: boolean;
  hasChevron?: boolean;
  hasSfSymbol?: boolean;
  testID?: string;
}

const MenuItem = ({
  hasRightArrow,
  onPress,
  leftComponent,
  rightComponent,
  size,
  titleComponent,
  labelComponent,
  disabled,
  hasChevron,
  hasSfSymbol,
  width,
  testID,
}: MenuItemProps) => {
  const { colors } = useTheme();

  const Item = () => (
    <Box
      height={size ? { custom: size } : 'full'}
      justifyContent="center"
      paddingHorizontal={{ custom: 16 }}
      testID={disabled ? testID : undefined}
      width="full"
    >
      <Inline alignHorizontal="justify" alignVertical="center">
        <Box flexShrink={1}>
          <Inline alignVertical="center" wrap={false}>
            {leftComponent && (
              <Box width={{ custom: hasSfSymbol ? 34 : 46 }}>
                {hasSfSymbol ? (
                  <Box alignItems="center" width={{ custom: 28 }}>
                    {leftComponent}
                  </Box>
                ) : (
                  leftComponent
                )}
              </Box>
            )}

            <Box flexShrink={1}>
              <Stack width={width} space="8px">
                {titleComponent}
                {labelComponent}
              </Stack>
            </Box>
          </Inline>
        </Box>
        <Box paddingLeft="8px">
          <Inline alignVertical="center" space={{ custom: 9 }}>
            {rightComponent}
            {hasRightArrow && (
              <Box
                as={ImgixImage}
                height={{ custom: 16 }}
                source={Caret as Source}
                tintColor={colors.blueGreyDark60}
                width={{ custom: 7 }}
                size={30}
              />
            )}
            {hasChevron && (
              <Box
                as={ImgixImage}
                height={{ custom: 17 }}
                source={Chevron as Source}
                tintColor={colors.blueGreyDark60}
                width={{ custom: 16 }}
                size={30}
              />
            )}
          </Inline>
        </Box>
      </Inline>
    </Box>
  );

  return disabled ? (
    <Item />
  ) : (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} testID={testID}>
      <Item />
    </ButtonPressAnimation>
  );
};

MenuItem.ImageIcon = ImageIcon;
MenuItem.Label = Label;
MenuItem.Selection = Selection;
MenuItem.StatusIcon = StatusIcon;
MenuItem.TextIcon = TextIcon;
MenuItem.Title = Title;

export default MenuItem;
