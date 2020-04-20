import PropTypes from 'prop-types';
import React from 'react';
import { LayoutAnimation, View } from 'react-native';
import { colors } from '../../styles';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { Text } from '../text';

const CoinDividerEditButton = ({
  isActive,
  isVisible,
  onPress,
  shouldReloadList,
  style,
  text,
  textOpacityAlwaysOn,
}) => (
  <OpacityToggler endingOpacity={1} startingOpacity={0} isVisible={isVisible}>
    <ButtonPressAnimation
      onPress={async () => {
        await onPress();
        if (shouldReloadList) {
          LayoutAnimation.configureNext(
            LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
          );
        }
      }}
      scaleTo={textOpacityAlwaysOn || isActive ? 0.9 : 1}
    >
      <View
        style={[
          {
            backgroundColor: isActive
              ? colors.appleBlue
              : colors.alpha(colors.blueGreyDark, 0.06),
            borderRadius: 15,
            height: 30,
            justifyContent: 'center',
            paddingBottom: 6,
            paddingHorizontal: 10,
            paddingTop: 5,
            shadowColor: colors.appleBlue,
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: isActive ? 0.4 : 0,
            shadowRadius: 6,
          },
          style,
        ]}
      >
        <Text
          align="center"
          color={isActive ? 'white' : colors.alpha(colors.blueGreyDark, 0.6)}
          style={{
            opacity: textOpacityAlwaysOn || isActive ? 1 : 0.3333333333,
          }}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          {text}
        </Text>
      </View>
    </ButtonPressAnimation>
  </OpacityToggler>
);

CoinDividerEditButton.propTypes = {
  isActive: PropTypes.bool,
  isVisible: PropTypes.bool,
  onPress: PropTypes.func,
  shouldReloadList: PropTypes.bool,
  style: PropTypes.object,
  text: PropTypes.string,
  textOpacityAlwaysOn: PropTypes.bool,
};

export default CoinDividerEditButton;
