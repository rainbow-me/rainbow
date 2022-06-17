import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import TokenFamilyHeaderIcon from './TokenFamilyHeaderIcon';
import { Text } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { padding } from '@rainbow-me/styles';
import { ThemeContextProps } from '@rainbow-me/theme';

const AnimatedImgixImage = Animated.createAnimatedComponent(ImgixImage);

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

const cx = StyleSheet.create({
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: TokenFamilyHeaderHeight,
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    flex: 1,
    paddingRight: 9,
  },
});

const TokenFamilyHeader = ({
  childrenAmount,
  emoji,
  familyImage,
  isCoinRow,
  isOpen,
  onPress,
  testID,
  title,
  theme,
}: {
  childrenAmount?: number;
  emoji?: string;
  familyImage?: string;
  isCoinRow?: boolean;
  isOpen?: boolean;
  onPress?: () => void;
  testID?: string;
  title: string;
  theme: ThemeContextProps;
}) => {
  const { colors } = theme;

  const toValue = Number(!!isOpen);

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
    <ButtonPressAnimation
      key={`token_family_header_${emoji || familyImage || title}`}
      onPress={onPress}
      scaleTo={1.05}
      testID={testID}
    >
      <View
        style={[
          cx.content,
          {
            backgroundColor: colors.white,
            ...padding.object(0, isCoinRow ? 19 : 19),
          },
        ]}
      >
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          {emoji ? (
            <Text containsEmoji size="16px">
              {emoji}
            </Text>
          ) : (
            <TokenFamilyHeaderIcon
              familyImage={familyImage}
              familyName={title}
              isCoinRow={isCoinRow}
              theme={theme}
            />
          )}
        </RowWithMargins>
        <View
          style={[cx.title, { paddingLeft: title === 'Showcase' ? 1 : 10 }]}
        >
          <Text numberOfLines={1} size="18px" weight="heavy">
            {title}
          </Text>
        </View>
        <RowWithMargins align="center" margin={10}>
          <Animated.View style={amountAnimatedStyles}>
            <Text align="right" size="18px">
              {childrenAmount}
            </Text>
          </Animated.View>
          <AnimatedImgixImage
            resizeMode={ImgixImage.resizeMode.contain}
            // @ts-expect-error Typing mismatch.
            source={CaretImageSource}
            style={imageAnimatedStyles}
            tintColor={colors.dark}
          />
        </RowWithMargins>
      </View>
    </ButtonPressAnimation>
  );
};

export default React.memo(TokenFamilyHeader);
