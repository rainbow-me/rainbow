import React, { useCallback, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigation } from '../../../navigation/Navigation';
import { ShimmerAnimation } from '../../animations';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
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
import Routes from '@rainbow-me/routes';

export function InfoRowSkeleton() {
  const { colors } = useTheme();
  return (
    <Inline alignHorizontal="justify" horizontalSpace="24px" wrap={false}>
      <Box
        style={{
          backgroundColor: colors.alpha(colors.blueGreyDark, 0.04),
          borderRadius: 12,
          height: 24,
          overflow: 'hidden',
          width: 100,
        }}
      >
        <ShimmerAnimation
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          enabled
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06)}
          width={100}
        />
      </Box>
      <Box
        style={{
          backgroundColor: colors.alpha(colors.blueGreyDark, 0.04),
          borderRadius: 12,
          height: 24,
          overflow: 'hidden',
          width: 150,
        }}
      >
        <ShimmerAnimation
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          enabled
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06)}
          width={150}
        />
      </Box>
    </Inline>
  );
}

export default function InfoRow({
  explainSheetType,
  icon = undefined,
  isImage = false,
  label,
  wrapValue = children => children,
  value = undefined,
  useAccentColor,
}: {
  explainSheetType?: string;
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

  const { navigate } = useNavigation();
  const handlePressExplain = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, { type: explainSheetType });
  }, [explainSheetType, navigate]);

  return (
    <Inline alignHorizontal="justify" horizontalSpace="24px" wrap={false}>
      <Box style={{ minWidth: 60, opacity: show ? 1 : 0 }}>
        <Inset top={isMultiline ? '15px' : '10px'}>
          <Inline space="4px">
            <Text color="secondary60" size="16px" weight="bold">
              {label}
            </Text>
            {explainSheetType && (
              <ButtonPressAnimation onPress={handlePressExplain}>
                <Text color="secondary20" size="16px" weight="bold">
                  􀅵
                </Text>
              </ButtonPressAnimation>
            )}
          </Inline>
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
