import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { Animated, Easing } from 'react-native';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';
import { useAccountSettings } from '@/hooks';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';

const AnimatedImgixImage = Animated.createAnimatedComponent(ImgixImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 44;

const SumValueText = styled(Text).attrs({
  align: 'right',
  weight: 'medium',
  size: 'large',
})({
  color: ({ theme: { colors } }) => colors.dark,
  marginBottom: 1,
});

const ListHeaderEmoji = styled(Emoji).attrs({ size: 'medium' })({
  marginBottom: 3.5,
});

const SavingsListHeader = ({ emoji, isOpen, onPress, savingsSumValue, showSumValue, title }) => {
  const { nativeCurrency } = useAccountSettings();
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
    <ButtonPressAnimation
      key={`${emoji}_${isOpen}`}
      marginBottom={title === 'Pools' ? -6 : 0}
      onPress={onPress}
      scaleTo={1.05}
      testID={`${title}-list-header`}
    >
      <Row align="center" height={TokenFamilyHeaderHeight} justify="space-between" paddingHorizontal={19} width="100%">
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          <ListHeaderEmoji name={emoji} />
          <TruncatedText color={colors.dark} letterSpacing="roundedMedium" lineHeight="normal" size="large" weight="heavy">
            {title}
          </TruncatedText>
        </RowWithMargins>
        <RowWithMargins align="center" margin={13}>
          {showSumValue && (
            <Animated.View style={sumNumberAnimatedStyles}>
              <SumValueText>
                {Number(savingsSumValue) || Number(savingsSumValue) === 0
                  ? convertAmountToNativeDisplay(savingsSumValue, nativeCurrency)
                  : savingsSumValue}
              </SumValueText>
            </Animated.View>
          )}
          <AnimatedImgixImage
            resizeMode={ImgixImage.resizeMode.contain}
            source={CaretImageSource}
            style={imageAnimatedStyles}
            tintColor={colors.dark}
            size={30}
          />
        </RowWithMargins>
      </Row>
    </ButtonPressAnimation>
  );
};

SavingsListHeader.animationDuration = TokenFamilyHeaderAnimationDuration;

SavingsListHeader.height = TokenFamilyHeaderHeight;

SavingsListHeader.propTypes = {
  emoji: PropTypes.string,
  isOpen: PropTypes.bool,
  onPress: PropTypes.func,
  savingsSumValue: PropTypes.string,
  showSumValue: PropTypes.bool,
  title: PropTypes.string,
};

SavingsListHeader.defaultProps = {
  emoji: 'sunflower',
  savingsSumValue: '0',
  showSumValue: false,
  title: lang.t('account.tab_savings'),
};

export default SavingsListHeader;
