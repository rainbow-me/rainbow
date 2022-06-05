import React, { useCallback, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { useNavigation } from '../../../navigation/Navigation';
import { useTheme } from '../../../theme/ThemeContext';
import { ShimmerAnimation } from '../../animations';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Icon } from '../../icons';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import {
  Bleed,
  Box,
  Inline,
  Inset,
  Space,
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
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06) as any}
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
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06) as any}
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
  switchValue,
  switchDisabled,
  useAccentColor,
  onSwitchChange,
}: {
  explainSheetType?: string;
  icon?: string;
  isImage?: boolean;
  label: string;
  wrapValue?: (children: React.ReactNode) => React.ReactNode;
  value?: string;
  switchValue?: boolean;
  switchDisabled?: boolean;
  useAccentColor?: boolean;
  onSwitchChange?: () => void;
}) {
  const { colors } = useTheme();
  const accentColor = useForegroundColor('accent');

  const [show, setShow] = useState(isImage);
  const [isMultiline, setIsMultiline] = useState(false);
  const isSwitch = switchValue !== undefined;

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
                <Text color="secondary25" size="16px" weight="bold">
                  􀅵
                </Text>
              </ButtonPressAnimation>
            )}
          </Inline>
        </Inset>
      </Box>
      {wrapValue(
        isImage ? (
          <>
            {value && (
              <ImagePreviewOverlayTarget
                aspectRatioType="cover"
                imageUrl={value}
              >
                <Box as={ImgixImage} height="full" source={{ uri: value }} />
              </ImagePreviewOverlayTarget>
            )}
          </>
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
            padding={
              (isSwitch ? '0px' : isMultiline ? '15px' : '10px') as Space
            }
            style={{
              backgroundColor: isSwitch
                ? 'transparent'
                : useAccentColor
                ? accentColor + '10'
                : 'rgba(255, 255, 255, 0.08)',
              opacity: show ? 1 : 0,
            }}
          >
            <Inline alignVertical="center" space="6px">
              {icon && (
                <Bleed vertical="6px">
                  <Icon
                    color={colors.whiteLabel}
                    height="18"
                    name={icon}
                    width="18"
                  />
                </Bleed>
              )}
              {value && (
                <Text
                  align={isMultiline ? 'left' : 'center'}
                  color={useAccentColor ? 'accent' : undefined}
                  containsEmoji
                  weight={isMultiline ? 'semibold' : 'bold'}
                >
                  {value}
                </Text>
              )}
              {isSwitch && (
                <Switch
                  disabled={switchDisabled || switchValue}
                  onValueChange={onSwitchChange}
                  testID="ens-reverse-record-switch"
                  trackColor={{ false: colors.white, true: accentColor }}
                  value={switchValue}
                />
              )}
            </Inline>
          </Box>
        )
      )}
    </Inline>
  );
}
