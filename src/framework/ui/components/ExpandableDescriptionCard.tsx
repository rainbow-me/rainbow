import { memo, useCallback, useState } from 'react';
import { StyleSheet, View, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Text, TextIcon } from '@/design-system';
import { type TextProps } from '@/design-system/components/Text/Text';

const CTA_GRADIENT_WIDTH = 100;
const DEFAULT_NUMBER_OF_LINES = 3;

type ExpandableDescriptionCardProps = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  ctaColor: TextProps['color'];
  ctaIcon: string;
  ctaLabel: string;
  description: string;
  onPress: () => void;
  numberOfLines?: number;
  scaleTo?: number;
  textColor?: TextProps['color'];
  textSize?: TextProps['size'];
  textWeight?: TextProps['weight'];
};

export const ExpandableDescriptionCard = memo(function ExpandableDescriptionCard({
  backgroundColor,
  borderColor,
  borderWidth,
  ctaColor,
  ctaIcon,
  ctaLabel,
  description,
  onPress,
  numberOfLines = DEFAULT_NUMBER_OF_LINES,
  scaleTo = 0.95,
  textColor = 'labelTertiary',
  textSize = '17pt / 150%',
  textWeight = 'medium',
}: ExpandableDescriptionCardProps) {
  const [showCallToAction, setShowCallToAction] = useState(false);

  const onDescriptionLayout = useCallback(
    ({ nativeEvent: { lines } }: NativeSyntheticEvent<TextLayoutEventData>) => {
      const nextShowCallToAction = lines.length >= numberOfLines;
      setShowCallToAction(currentValue => (currentValue === nextShowCallToAction ? currentValue : nextShowCallToAction));
    },
    [numberOfLines]
  );

  return (
    <ButtonPressAnimation onPress={showCallToAction ? onPress : undefined} scaleTo={scaleTo}>
      <Box
        width="full"
        backgroundColor={backgroundColor}
        borderRadius={26}
        padding="20px"
        borderWidth={borderWidth}
        borderColor={{ custom: borderColor }}
      >
        <Text color={textColor} size={textSize} weight={textWeight} numberOfLines={numberOfLines} onTextLayout={onDescriptionLayout}>
          {description}
        </Text>
        {showCallToAction && (
          <View style={styles.callToActionRow}>
            <Box flexDirection="row" alignItems="center" justifyContent="center">
              <EasingGradient
                startPosition="left"
                endPosition="right"
                startColor={backgroundColor}
                endColor={backgroundColor}
                startOpacity={0}
                endOpacity={1}
                style={styles.callToActionGradient}
              />
              <Box flexDirection="row" alignItems="center" gap={4} backgroundColor={backgroundColor}>
                <Text color={ctaColor} size="15pt" weight="bold">
                  {ctaLabel}
                </Text>
                <TextIcon size="icon 12px" weight="heavy" color={ctaColor}>
                  {ctaIcon}
                </TextIcon>
              </Box>
            </Box>
          </View>
        )}
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  callToActionGradient: {
    height: 26,
    width: CTA_GRADIENT_WIDTH,
  },
  callToActionRow: {
    bottom: 12,
    height: 26,
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
});
