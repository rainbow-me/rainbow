import React from 'react';
import { Source } from 'react-native-fast-image';
import { Box, Space, Stack, Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import { ImageSourcePropType } from 'react-native';

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
    marginTop={{ custom: 0 }}
    marginBottom={{ custom: 0 }}
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

type StatusType = 'not-enabled' | 'out-of-date' | 'up-to-date';

interface StatusIconProps {
  status: StatusType;
  text: string;
}

interface StatusColors {
  backgroundColor: string;
  color: string;
}

const StatusIcon = ({ status, text }: StatusIconProps) => {
  const { colors, isDarkMode } = useTheme();
  const statusColors: { [key in StatusType]: StatusColors } = {
    'up-to-date': {
      backgroundColor: colors.alpha(colors.green, 0.2),
      color: colors.green,
    },
    'not-enabled': {
      backgroundColor: isDarkMode ? colors.alpha(colors.blueGreyDark, 0.1) : colors.alpha(colors.blueGreyDark, 0.1),
      color: isDarkMode ? colors.alpha(colors.blueGreyDark, 0.6) : colors.alpha(colors.blueGreyDark, 0.8),
    },
    'out-of-date': {
      backgroundColor: colors.alpha(colors.brightRed, 0.2),
      color: colors.brightRed,
    },
  };
  return (
    <Box
      backgroundColor={statusColors[status].backgroundColor}
      borderRadius={23}
      shadowColor={isDarkMode ? colors.shadow : statusColors[status].backgroundColor}
      elevation={12}
      shadowOpacity={ios ? 0.4 : 1}
      shadowRadius={6}
      padding={{ custom: 8 }}
      marginTop={{ custom: 8 }}
      marginBottom={{ custom: 16 }}
    >
      <Text color={{ custom: statusColors[status].color } || 'label (Deprecated)'} size="14px / 19px (Deprecated)" weight="bold">
        {text}
      </Text>
    </Box>
  );
};

interface TitleProps {
  text: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  disabled?: boolean;
  isLink?: boolean;
}

const Title = ({ text, weight = 'semibold' }: TitleProps) => (
  <Text color={'primary (Deprecated)'} size="18px / 27px (Deprecated)" weight={weight} numberOfLines={1}>
    {text}
  </Text>
);

interface LabelProps {
  text: string;
  linkText?: string;
  onPress?: () => void;
}

const Label = ({ text, linkText, onPress }: LabelProps) => {
  return (
    <Text color={'secondary60 (Deprecated)'} size="14px / 19px (Deprecated)" align="center" weight="medium">
      {text}
      {linkText && onPress && (
        <Text onPress={onPress} color="blue" size="14px / 19px (Deprecated)" weight="medium">
          {' '}
          {linkText}
        </Text>
      )}
    </Text>
  );
};

interface MenuHeaderProps {
  iconComponent?: React.ReactNode;
  titleComponent: React.ReactNode;
  statusComponent?: React.ReactNode;
  labelComponent?: React.ReactNode;
  paddingTop?: Space;
  paddingBottom?: Space;
  testID?: string;
}

const MenuHeader = ({
  iconComponent,
  titleComponent,
  statusComponent,
  labelComponent,
  paddingTop = { custom: 32 },
  paddingBottom = { custom: 32 },
  testID,
}: MenuHeaderProps) => {
  return (
    <Box
      height="full"
      paddingTop={paddingTop}
      paddingBottom={paddingBottom}
      justifyContent="center"
      alignItems="center"
      testID={testID}
      width="full"
      paddingHorizontal={{ custom: 32 }}
    >
      <Stack alignHorizontal="center">
        {iconComponent}
        {titleComponent}
        {statusComponent}
        {labelComponent}
      </Stack>
    </Box>
  );
};

MenuHeader.ImageIcon = ImageIcon;
MenuHeader.Label = Label;
MenuHeader.Selection = Selection;
MenuHeader.StatusIcon = StatusIcon;
MenuHeader.TextIcon = TextIcon;
MenuHeader.Title = Title;

export default MenuHeader;
