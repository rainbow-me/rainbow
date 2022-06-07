import React from 'react';
import { Animated, Easing } from 'react-native';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';
import TokenFamilyHeaderIcon from './TokenFamilyHeaderIcon';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

const AnimatedImgixImage = Animated.createAnimatedComponent(ImgixImage);

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})(({ isCoinRow, theme: { colors } }) => ({
  ...padding.object(0, isCoinRow ? 19 : 19),
  backgroundColor: colors.white,
  height: TokenFamilyHeaderHeight,
  width: '100%',
}));

const ChildrenAmountText = styled(Text).attrs({
  align: 'right',
  letterSpacing: 'roundedTight',
  size: 'large',
})({
  marginBottom: 1,
});

const TitleText = styled(TruncatedText).attrs({
  align: 'left',
  letterSpacing: 'roundedMedium',
  lineHeight: 'normal',
  size: 'large',
  weight: 'heavy',
})({
  flex: 1,
  marginBottom: 1,
  paddingLeft: 10,
  paddingRight: 9,
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
}) => {
  const { colors } = useTheme();

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
      <Content isCoinRow={isCoinRow}>
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          {emoji ? (
            <Emoji name={emoji} size="lmedium" />
          ) : (
            <TokenFamilyHeaderIcon
              familyImage={familyImage}
              familyName={title}
              isCoinRow={isCoinRow}
            />
          )}
        </RowWithMargins>
        <TitleText>{title}</TitleText>
        <RowWithMargins align="center" margin={10}>
          <Animated.View style={amountAnimatedStyles}>
            <ChildrenAmountText>{childrenAmount}</ChildrenAmountText>
          </Animated.View>
          <AnimatedImgixImage
            resizeMode={ImgixImage.resizeMode.contain}
            source={CaretImageSource}
            style={imageAnimatedStyles}
            tintColor={colors.dark}
          />
        </RowWithMargins>
      </Content>
    </ButtonPressAnimation>
  );
};

export default React.memo(TokenFamilyHeader);
