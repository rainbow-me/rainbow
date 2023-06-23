import React, { useEffect, useMemo, useState } from 'react';
import useOpenPositionCards from '@/hooks/useOpenPositionCards';
import { Animated, Easing } from 'react-native';
import CaretImageSource from '../../../assets/family-dropdown-arrow.png';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { ImgixImage } from '@/components/images';
import { Box, Inline, Text } from '@/design-system';
import { StickyHeader } from './core/StickyHeaders';

const AnimatedImgixImage = Animated.createAnimatedComponent(ImgixImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 44;

const PositionListHeader = ({ total, ...props }: { total: string }) => {
  const { colors } = useTheme();
  const {
    isPositionCardsOpen,
    toggleOpenPositionCards,
  } = useOpenPositionCards();

  const toValue = Number(!!isPositionCardsOpen);

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
    }),
    [animation]
  );

  return (
    <>
      <StickyHeader name="Positions">
        <ButtonPressAnimation
          key={`positions_${isPositionCardsOpen}`}
          onPress={toggleOpenPositionCards}
          scaleTo={1.05}
          testID={`positions-list-header`}
          {...props}
        >
          <Box
            height={{ custom: TokenFamilyHeaderHeight }}
            paddingHorizontal={'19px (Deprecated)'}
            justifyContent="center"
          >
            <Inline alignHorizontal="justify" alignVertical="center">
              <Text size="22pt" color={'label'} weight="heavy">
                Positions
              </Text>
              <Inline horizontalSpace={'8px'} alignVertical="center">
                {!isPositionCardsOpen && (
                  <Animated.View style={sumNumberAnimatedStyles}>
                    <Text size="20pt" color={'label'} weight="regular">
                      {total}
                    </Text>
                  </Animated.View>
                )}
                <AnimatedImgixImage
                  resizeMode={ImgixImage.resizeMode.contain}
                  source={CaretImageSource as any}
                  style={imageAnimatedStyles}
                  tintColor={colors.dark}
                  size={30}
                />
              </Inline>
            </Inline>
          </Box>
        </ButtonPressAnimation>
      </StickyHeader>
    </>
  );
};

PositionListHeader.animationDuration = TokenFamilyHeaderAnimationDuration;

PositionListHeader.height = TokenFamilyHeaderHeight;

export default PositionListHeader;
