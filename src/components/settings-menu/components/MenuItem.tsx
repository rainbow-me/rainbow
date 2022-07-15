import React from 'react';
import { Switch as NativeSwitch } from 'react-native';
import { Source } from 'react-native-fast-image';
import Caret from '@rainbow-me/assets/family-dropdown-arrow.png';
import { ButtonPressAnimation } from '../../animations';
import CheckmarkCircledIcon from '../../icons/svg/CheckmarkCircledIcon';
import WarningIcon from '../../icons/svg/WarningIcon';
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

interface EmojiIconProps {
  children: string;
}

const EmojiIcon = ({ children }: EmojiIconProps) => (
  <Text containsEmoji size="18px">
    {children}
  </Text>
);

interface SelectionProps {
  children: React.ReactNode;
}

const Selection = ({ children }: SelectionProps) => (
  <Text color="secondary60" size="18px" weight="semibold">
    {children}
  </Text>
);

const Switch = () => <NativeSwitch />;

interface StatusIconProps {
  colors: any;
  status: 'complete' | 'incomplete' | 'warning';
}

const StatusIcon = ({ colors, status }: StatusIconProps) =>
  status === 'warning' ? (
    <WarningIcon color={colors.orangeLight} colors={colors} />
  ) : (
    <CheckmarkCircledIcon
      color={
        status === 'complete'
          ? colors.green
          : colors.alpha(colors.blueGreyDark, 0.5)
      }
      colors={colors}
    />
  );

interface TitleProps {
  text: string;
  isHeader?: boolean;
}

const Title = ({ text, isHeader }: TitleProps) => (
  <Text
    color="primary"
    containsEmoji
    size="18px"
    weight={isHeader ? 'bold' : 'semibold'}
  >
    {text}
  </Text>
);

interface LabelProps {
  text: string;
  warn?: boolean;
}

function Label({ text, warn }: LabelProps) {
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
}

interface MenuItemProps {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  size: 'medium' | 'large';
  iconPadding?: 'small' | 'medium' | 'large';
  hasRightArrow?: boolean;
  onPress?: () => void;
  titleComponent: React.ReactNode;
  labelComponent: React.ReactNode;
}

function MenuItem({
  hasRightArrow,
  onPress,
  leftComponent,
  rightComponent,
  size,
  iconPadding,
  titleComponent,
  labelComponent,
}: MenuItemProps) {
  const { colors } = useTheme();
  const space =
    iconPadding === 'small'
      ? 6
      : iconPadding === 'medium'
      ? 10
      : iconPadding === 'large'
      ? 17
      : 0;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
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
          </Inline>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
}

MenuItem.Title = Title;
MenuItem.Label = Label;
MenuItem.EmojiIcon = EmojiIcon;
MenuItem.ImageIcon = ImageIcon;
MenuItem.Selection = Selection;
MenuItem.Switch = Switch;
MenuItem.StatusIcon = StatusIcon;

export default MenuItem;
