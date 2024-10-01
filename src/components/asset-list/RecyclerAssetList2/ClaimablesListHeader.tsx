import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image } from 'react-native';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { useTheme } from '@/theme/ThemeContext';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Text } from '@/design-system';
import * as i18n from '@/languages';
import useOpenClaimables from '@/hooks/useOpenClaimables';

const AnimatedImgixImage = Animated.createAnimatedComponent(Image);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 48;

export const ClaimablesListHeader = React.memo(function ClaimablesListHeader({ total }: { total: string }) {
  const { colors } = useTheme();
  const { isClaimablesOpen, toggleOpenClaimables } = useOpenClaimables();

  const toValue = Number(!!isClaimablesOpen);

  const [animation] = useState(() => new Animated.Value(toValue));

  useEffect(() => {
    Animated.timing(animation, {
      duration: TokenFamilyHeaderAnimationDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      toValue,
      useNativeDriver: true,
    }).start();
  }, [toValue, animation]);

  const imageAnimatedStyles = useMemo(
    () => ({
      height: 18,
      marginBottom: 1,
      right: 5,
      transform: [
        {
          rotate: animation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '90deg'],
          }),
        },
      ],
      width: 8,
    }),
    [animation]
  );

  const sumNumberAnimatedStyles = useMemo(
    () => ({
      opacity: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      paddingRight: 4,
    }),
    [animation]
  );

  return (
    <ButtonPressAnimation
      key={`claimables_${isClaimablesOpen}`}
      onPress={toggleOpenClaimables}
      scaleTo={1.05}
      testID={`claimables-list-header`}
    >
      <Box height={{ custom: TokenFamilyHeaderHeight }} paddingHorizontal={'19px (Deprecated)'} justifyContent="center">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Text size="22pt" color={'label'} weight="heavy">
            {i18n.t(i18n.l.account.tab_claimables)}
          </Text>
          <Inline horizontalSpace={'8px'} alignVertical="center">
            {!isClaimablesOpen && (
              <Animated.View style={sumNumberAnimatedStyles}>
                <Text size="20pt" color={'label'} weight="regular">
                  {total}
                </Text>
              </Animated.View>
            )}
            <AnimatedImgixImage source={CaretImageSource} style={imageAnimatedStyles} tintColor={colors.dark} />
          </Inline>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
});
