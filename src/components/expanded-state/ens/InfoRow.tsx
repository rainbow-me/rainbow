import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Icon } from '../../icons';
import {
  Bleed,
  Box,
  Inline,
  Inset,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

export default function InfoRow({
  icon = undefined,
  isImage = false,
  label,
  wrapValue = children => children,
  value = undefined,
  useAccentColor,
}: {
  icon?: string;
  isImage?: boolean;
  label: string;
  wrapValue?: (children: React.ReactNode) => React.ReactNode;
  value?: string;
  useAccentColor?: boolean;
}) {
  const { colors } = useTheme();
  const accentColor = useForegroundColor('accent');

  const [show, setShow] = useState(isImage);
  const [isMultiline, setIsMultiline] = useState(false);

  return (
    <Inline alignHorizontal="justify" horizontalSpace="24px" wrap={false}>
      <Box style={{ minWidth: 60, opacity: show ? 1 : 0 }}>
        <Inset top={isMultiline ? '15px' : '10px'}>
          <Text color="secondary60" size="16px" weight="bold">
            {label}
          </Text>
        </Inset>
      </Box>
      {wrapValue(
        <>
          {isImage ? (
            <Box
              as={ImgixImage}
              borderRadius={16}
              flexShrink={1}
              height="64px"
              source={{ uri: value }}
              width="full"
            />
          ) : (
            <Box
              borderRadius={16}
              flexShrink={1}
              onLayout={({
                nativeEvent: {
                  layout: { height },
                },
              }) => {
                setIsMultiline(height > 40);
                setShow(true);
              }}
              padding={isMultiline ? '15px' : '10px'}
              style={{
                backgroundColor: useAccentColor
                  ? accentColor + '10'
                  : 'rgba(255, 255, 255, 0.08)',
                opacity: show ? 1 : 0,
              }}
            >
              <Inline alignVertical="center" space="6px">
                {icon && (
                  <Bleed vertical="2px">
                    <Icon
                      color={colors.white}
                      height="18"
                      name={icon}
                      width="18"
                    />
                  </Bleed>
                )}
                {value && (
                  <Text
                    color={useAccentColor ? 'accent' : undefined}
                    containsEmoji
                    weight="semibold"
                  >
                    {value}
                  </Text>
                )}
              </Inline>
            </Box>
          )}
        </>
      )}
    </Inline>
  );
}
