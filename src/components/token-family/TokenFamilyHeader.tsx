import lang from 'i18n-js';
import React, { useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { useLatestCallback } from '../../hooks';
import { ButtonPressAnimation } from '../animations';
import TokenFamilyHeaderIcon from './TokenFamilyHeaderIcon';
import { Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { ThemeContextProps } from '@/theme';

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

const sx = StyleSheet.create({
  amountContainer: {
    marginRight: 10,
  },
  center: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chevron: {
    height: 18,
    width: 8,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: TokenFamilyHeaderHeight,
    justifyContent: 'space-between',
    padding: 19,
    paddingRight: 14,
    width: '100%',
  },
  title: {
    flex: 1,
    paddingRight: 9,
  },
});

type Props = {
  childrenAmount?: number;
  emoji?: string;
  familyImage?: string;
  isOpen?: boolean;
  onPress?: () => void;
  testID?: string;
  title: string;
  theme: ThemeContextProps;
};

const TokenFamilyHeader = ({ childrenAmount, emoji, familyImage, isOpen, onPress, testID, title, theme }: Props) => {
  const { colors } = theme;

  const toValue = Number(!!isOpen);

  const aRef = useRef<{
    animation: Animated.Value;
    toValue: number;
    isRunning: boolean;
  } | null>(null);

  // HACK ALERT
  // we are reusing the same animated value across rows when we recycle them
  // only happens when previous and next row are both open or closed
  // but also we don't want the animated value to change
  // during the animation too
  if (aRef.current === null || (aRef.current.toValue !== toValue && !aRef.current.isRunning)) {
    aRef.current = {
      animation: new Animated.Value(toValue),
      isRunning: false,
      toValue,
    };
  }

  const { animation } = aRef.current!;

  const handlePress = useLatestCallback(() => {
    Animated.timing(animation, {
      duration: TokenFamilyHeaderAnimationDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      toValue: isOpen ? 0 : 1,
      useNativeDriver: true,
    }).start(() => {
      aRef.current!.isRunning = false;
    });

    aRef.current!.isRunning = true;

    if (onPress) {
      onPress();
    }
  });

  const imageAnimatedStyles = useMemo(
    () => ({
      marginBottom: 1,
      marginLeft: 5,
      transform: [
        {
          rotate: animation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '90deg'],
          }),
        },
      ],
    }),
    [animation]
  );

  const amountAnimatedStyles = useMemo(
    () => ({
      opacity: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
    }),
    [animation]
  );

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={1.05} testID={testID}>
      <View
        style={[
          sx.content,
          {
            backgroundColor: colors.white,
          },
        ]}
      >
        <View style={[sx.center, { marginRight: emoji ? 5 : 0 }]}>
          {emoji ? (
            <Text containsEmoji color="primary (Deprecated)" size="16px / 22px (Deprecated)">
              {emoji}
            </Text>
          ) : (
            <TokenFamilyHeaderIcon familyImage={familyImage} familyName={title} theme={theme} />
          )}
        </View>
        <View style={[sx.title, { paddingLeft: 10 }]}>
          <Text
            color={title === lang.t('button.hidden') ? 'secondary60 (Deprecated)' : 'primary (Deprecated)'}
            numberOfLines={1}
            size="18px / 27px (Deprecated)"
            weight="heavy"
          >
            {title}
          </Text>
        </View>
        <View style={[sx.center, sx.amountContainer]}>
          <Animated.View style={amountAnimatedStyles}>
            <Text
              align="right"
              color={title === lang.t('button.hidden') ? 'secondary60 (Deprecated)' : 'primary (Deprecated)'}
              size="18px / 27px (Deprecated)"
            >
              {childrenAmount}
            </Text>
          </Animated.View>
          <Animated.View style={imageAnimatedStyles}>
            <FastImage
              resizeMode={ImgixImage.resizeMode.contain}
              // @ts-expect-error static image source
              source={CaretImageSource}
              style={sx.chevron}
              tintColor={title === lang.t('button.hidden') ? colors.blueGreyDark60 : colors.dark}
            />
          </Animated.View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
};

export default React.memo(TokenFamilyHeader);
