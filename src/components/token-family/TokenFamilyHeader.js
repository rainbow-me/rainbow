import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import Highlight from '../Highlight';
import { ButtonPressAnimation, interpolate } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';
import TokenFamilyHeaderIcon from './TokenFamilyHeaderIcon';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 50;

const TokenFamilyHeader = ({
  childrenAmount,
  emoji,
  familyImage,
  highlight,
  isCoinRow,
  isOpen,
  onPress,
  title,
}) => {
  const animation = useTimingTransition(!isOpen, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  return (
    <ButtonPressAnimation
      key={`${emoji || familyImage || title}_${isOpen}`}
      onPress={onPress}
      scaleTo={1.05}
    >
      <Row
        align="center"
        backgroundColor={colors.white}
        height={TokenFamilyHeaderHeight}
        justify="space-between"
        paddingHorizontal={isCoinRow ? 16 : 19}
        width="100%"
      >
        <Highlight visible={highlight} />
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          {emoji ? (
            <Emoji size="lmedium" name={emoji} />
          ) : (
            <TokenFamilyHeaderIcon
              familyImage={familyImage}
              familyName={title}
              isCoinRow={isCoinRow}
            />
          )}
          <TruncatedText
            letterSpacing="roundedMedium"
            lineHeight="normal"
            size="large"
            style={{ marginBottom: 1 }}
            weight="semibold"
          >
            {title}
          </TruncatedText>
        </RowWithMargins>
        <RowWithMargins align="center" margin={13}>
          <Animated.View
            style={{
              opacity: animation,
            }}
          >
            <Text
              align="right"
              color="dark"
              letterSpacing="roundedTight"
              size="large"
              style={{ marginBottom: 1 }}
            >
              {childrenAmount}
            </Text>
          </Animated.View>
          <AnimatedFastImage
            resizeMode={FastImage.resizeMode.contain}
            source={CaretImageSource}
            style={{
              height: 17,
              marginBottom: 1,
              right: 4,
              transform: [
                {
                  rotate: toRad(
                    interpolate(animation, {
                      inputRange: [0, 1],
                      outputRange: [90, 0],
                    })
                  ),
                },
              ],
              width: 9,
            }}
          />
        </RowWithMargins>
      </Row>
    </ButtonPressAnimation>
  );
};

TokenFamilyHeader.animationDuration = TokenFamilyHeaderAnimationDuration;

TokenFamilyHeader.height = TokenFamilyHeaderHeight;

TokenFamilyHeader.propTypes = {
  childrenAmount: PropTypes.number,
  emoji: PropTypes.string,
  familyImage: PropTypes.string,
  highlight: PropTypes.bool,
  isCoinRow: PropTypes.bool,
  isOpen: PropTypes.bool,
  onPress: PropTypes.func,
  title: PropTypes.string,
};

export default TokenFamilyHeader;
