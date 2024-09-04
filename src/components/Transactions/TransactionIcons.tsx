import React from 'react';
import { AnimatePresence, MotiView } from 'moti';

import { Bleed, Box, Text, globalColors, useForegroundColor } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { infoForEventType, motiTimingConfig } from '@/components/Transactions/constants';

import { useTheme } from '@/theme';
import { DetailInfo, EventInfo, EventType } from '@/components/Transactions/types';

export const EventIcon = ({ eventType }: { eventType: EventType }) => {
  const eventInfo: EventInfo = infoForEventType[eventType];

  const hideInnerFill = eventType === 'approve' || eventType === 'revoke';
  const isWarningIcon =
    eventType === 'failed' || eventType === 'insufficientBalance' || eventType === 'MALICIOUS' || eventType === 'WARNING';

  return (
    <IconContainer>
      {!hideInnerFill && (
        <Box
          borderRadius={10}
          height={{ custom: 12 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          top={{ custom: isWarningIcon ? 4.5 : 4 }}
          width={{ custom: isWarningIcon ? 5.5 : 12 }}
        />
      )}
      <Text align="center" color={eventInfo.iconColor} size="icon 17px" weight="bold">
        {eventInfo.icon}
      </Text>
    </IconContainer>
  );
};

export const DetailIcon = ({ detailInfo }: { detailInfo: DetailInfo }) => {
  return (
    <IconContainer>
      <Text align="center" color="labelTertiary" size="icon 13px" weight="semibold">
        {detailInfo.icon}
      </Text>
    </IconContainer>
  );
};

export const DetailBadge = ({ type, value }: { type: 'function' | 'unknown' | 'unverified' | 'verified'; value: string }) => {
  const { colors, isDarkMode } = useTheme();
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const infoForBadgeType: {
    [key: string]: {
      backgroundColor: string;
      borderColor: string;
      label?: string;
      text: TextColor;
      textOpacity?: number;
    };
  } = {
    function: {
      backgroundColor: 'transparent',
      borderColor: isDarkMode ? separatorTertiary : colors.alpha(separatorTertiary, 0.025),
      text: 'labelQuaternary',
    },
    unknown: {
      backgroundColor: 'transparent',
      borderColor: isDarkMode ? separatorTertiary : colors.alpha(separatorTertiary, 0.025),
      label: 'Unknown',
      text: 'labelQuaternary',
    },
    unverified: {
      backgroundColor: isDarkMode ? colors.alpha(colors.red, 0.05) : globalColors.red10,
      borderColor: colors.alpha(colors.red, 0.02),
      label: 'Unverified',
      text: 'red',
      textOpacity: 0.76,
    },
    verified: {
      backgroundColor: isDarkMode ? colors.alpha(colors.green, 0.05) : globalColors.green10,
      borderColor: colors.alpha(colors.green, 0.02),
      label: 'Verified',
      text: 'green',
      textOpacity: 0.76,
    },
  };

  return (
    <Box
      alignItems="center"
      height={{ custom: 24 }}
      justifyContent="center"
      marginRight={{ custom: -7 }}
      paddingHorizontal={{ custom: 5.75 }}
      style={{
        backgroundColor: infoForBadgeType[type].backgroundColor,
        borderColor: infoForBadgeType[type].borderColor,
        borderCurve: 'continuous',
        borderRadius: 10,
        borderWidth: 1.25,
      }}
    >
      <Box height={{ custom: 24 }} justifyContent="center" style={{ opacity: infoForBadgeType[type].textOpacity || undefined }}>
        <Text align="center" color={infoForBadgeType[type].text} numberOfLines={1} size="15pt" weight="semibold">
          {infoForBadgeType[type].label || value}
        </Text>
      </Box>
    </Box>
  );
};

export const VerifiedBadge = () => {
  return (
    <Bleed bottom={{ custom: 0.5 }}>
      <Box alignItems="center" justifyContent="center">
        <Box
          borderRadius={10}
          height={{ custom: 11 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          width={{ custom: 11 }}
        />
        <Text align="center" color={{ custom: globalColors.blue40 }} size="icon 15px" weight="heavy">
          􀇻
        </Text>
      </Box>
    </Bleed>
  );
};

export const AnimatedCheckmark = ({ visible }: { visible: boolean }) => {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          animate={{ opacity: 1, scale: 1, translateX: 0 }}
          exit={{ opacity: 0, scale: 0.6, translateX: 0 }}
          from={{ opacity: 0, scale: 0.8, translateX: 10 }}
          transition={{
            opacity: motiTimingConfig,
            scale: motiTimingConfig,
            translateX: motiTimingConfig,
          }}
        >
          <Bleed top={{ custom: 0.5 }}>
            <Box alignItems="center" justifyContent="center">
              <Box
                borderRadius={10}
                height={{ custom: 10 }}
                position="absolute"
                style={{ backgroundColor: globalColors.white100 }}
                width={{ custom: 10 }}
              />
              <Text align="center" color="blue" size="icon 13px" weight="heavy">
                􀁣
              </Text>
            </Box>
          </Bleed>
        </MotiView>
      )}
    </AnimatePresence>
  );
};

export const IconContainer = ({
  children,
  hitSlop,
  opacity,
  size = 20,
}: {
  children: React.ReactNode;
  hitSlop?: number;
  opacity?: number;
  size?: number;
}) => {
  // Prevent wide icons from being clipped
  const extraHorizontalSpace = 4;

  return (
    <Bleed
      horizontal={{ custom: (hitSlop || 0) + extraHorizontalSpace }}
      vertical={hitSlop ? { custom: hitSlop } : '6px'}
      space={hitSlop ? { custom: hitSlop } : undefined}
    >
      <Box
        alignItems="center"
        height={{ custom: size }}
        justifyContent="center"
        margin={hitSlop ? { custom: hitSlop } : undefined}
        style={{ opacity }}
        width={{ custom: size + extraHorizontalSpace * 2 }}
      >
        {children}
      </Box>
    </Bleed>
  );
};
