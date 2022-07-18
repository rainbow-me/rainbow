import React from 'react';
import { Switch as NativeSwitch } from 'react-native';
import { Source } from 'react-native-fast-image';
import { ButtonPressAnimation } from '../../animations';
import CheckmarkCircledIcon from '../../icons/svg/CheckmarkCircledIcon';
import WarningIcon from '../../icons/svg/WarningIcon';
import Caret from '@rainbow-me/assets/family-dropdown-arrow.png';
import { Box, Inline, Stack, Text } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { useTheme } from '@rainbow-me/theme';
const ICON_SIZE = 60;

interface ImageIconProps {
  source: StaticImageData;
}

const ImageIcon = ({ source }: ImageIconProps) => (
  <Box
    as={ImgixImage}
    borderRadius={ICON_SIZE / 2}
    height={{ custom: ICON_SIZE }}
    marginLeft={{ custom: -11 }}
    marginRight={{ custom: -11 }}
    marginTop={{ custom: 8 }}
    source={source as Source}
    width={{ custom: ICON_SIZE }}
  />
);

interface SelectionProps {
  children: React.ReactNode;
}

const Selection = ({ children }: SelectionProps) => (
  <Text color="secondary60" size="18px" weight="semibold">
    {children}
  </Text>
);

interface SwitchProps {
  onValueChange: (value: boolean) => void;
}

const Switch = ({ onValueChange }: SwitchProps) => (
  <NativeSwitch onValueChange={onValueChange} />
);

interface StatusIconProps {
  status: 'complete' | 'incomplete' | 'warning' | 'selected';
}

const StatusIcon = ({ status }: StatusIconProps) => {
  const { colors, isDarkMode } = useTheme();
  return status === 'warning' ? (
    <WarningIcon color={colors.orangeLight} colors={colors} />
  ) : (
    <CheckmarkCircledIcon
      color={
        status === 'complete'
          ? colors.green
          : status === 'incomplete'
          ? colors.alpha(colors.blueGreyDark, 0.5)
          : colors.appleBlue
      }
      colors={colors}
      shadowColor={colors.alpha(
        isDarkMode ? colors.shadow : colors.blueGreyDark50,
        0.4
      )}
      shadowOffset={{ height: 4, width: 0 }}
      shadowRadius={6}
    />
  );
};

interface TitleProps {
  text: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  disabled?: boolean;
  isLink?: boolean;
  colorOverride?: string;
}

const Title = ({
  text,
  weight = 'semibold',
  disabled,
  isLink,
  colorOverride,
}: TitleProps) => (
  <Text
    color={
      colorOverride
        ? { custom: colorOverride }
        : disabled
        ? 'secondary60'
        : isLink
        ? 'action'
        : 'primary'
    }
    containsEmoji
    size="18px"
    weight={weight}
  >
    {text}
  </Text>
);

interface LabelProps {
  text: string;
  warn?: boolean;
}

const Label = ({ text, warn }: LabelProps) => {
  const { colors } = useTheme();
  return (
    <Text
      color={warn ? { custom: colors.orangeLight } : 'secondary60'}
      size="14px"
      weight="medium"
    >
      {text}
    </Text>
  );
};

interface MenuItemProps {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  size: 'medium' | 'large';
  iconPadding?: 'small' | 'medium' | 'large';
  hasRightArrow?: boolean;
  onPress?: () => void;
  titleComponent: React.ReactNode;
  labelComponent?: React.ReactNode;
  disabled?: boolean;
  hasChevron?: boolean;
}

const MenuItem = ({
  hasRightArrow,
  onPress,
  leftComponent,
  rightComponent,
  size,
  iconPadding,
  titleComponent,
  labelComponent,
  disabled,
  hasChevron,
}: MenuItemProps) => {
  const { colors } = useTheme();
  const space =
    iconPadding === 'small'
      ? 6
      : iconPadding === 'medium'
      ? 10
      : iconPadding === 'large'
      ? 17
      : 0;

  const Item = () => (
    <Box
      height={{ custom: size === 'large' ? 60 : 52 }}
      justifyContent="center"
      paddingHorizontal={{ custom: 16 }}
      width="full"
    >
      <Inline alignHorizontal="justify" alignVertical="center">
        <Inline alignVertical="center" space={{ custom: space }}>
          {leftComponent}
          <Stack space="8px">
            {titleComponent}
            {labelComponent}
          </Stack>
        </Inline>
        <Inline alignVertical="center" space={{ custom: 9 }}>
          {rightComponent}
          {hasRightArrow && (
            <Box
              as={ImgixImage}
              height={{ custom: 15 }}
              source={Caret as Source}
              tintColor={colors.blueGreyDark60}
              width={{ custom: 5.83 }}
            />
          )}
          {hasChevron && (
            <Text color="secondary60" size="18px" weight="medium">
              􀆏
            </Text>
          )}
        </Inline>
      </Inline>
    </Box>
  );
  return disabled ? (
    <Item />
  ) : (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <Item />
    </ButtonPressAnimation>
  );
};

MenuItem.Title = Title;
MenuItem.Label = Label;
MenuItem.ImageIcon = ImageIcon;
MenuItem.Selection = Selection;
MenuItem.Switch = Switch;
MenuItem.StatusIcon = StatusIcon;

export default MenuItem;
