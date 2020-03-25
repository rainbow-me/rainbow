import PropTypes from 'prop-types';
import React from 'react';
import { OpacityToggler, ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { LayoutAnimation, View } from 'react-native';
import { getAssets } from '../../handlers/localstorage/accountLocal';
import { dataUpdateAssets } from '../../redux/data';
import store from '../../redux/store';
import { colors } from '../../styles';

const CoinDividerEditButton = ({
  isActive,
  isVisible,
  onPress,
  shouldRelaodList,
  style,
  text,
  textOpacityAlwaysOn,
}) => (
  <OpacityToggler endingOpacity={1} startingOpacity={0} isVisible={isVisible}>
    <ButtonPressAnimation
      onPress={async () => {
        await onPress();
        if (shouldRelaodList) {
          const assets = await getAssets(
            store.getState().settings.accountAddress,
            store.getState().settings.network
          );
          store.dispatch(dataUpdateAssets(assets));
          LayoutAnimation.configureNext(
            LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
          );
        }
      }}
    >
      <View
        style={[
          {
            backgroundColor: isActive ? colors.appleBlue : colors.lightBlueGrey,
            borderRadius: 15,
            height: 30,
            justifyContent: 'center',
            paddingHorizontal: 10,
            shadowColor: isActive ? colors.appleBlue : colors.white,
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          },
          style,
        ]}
      >
        <Text
          color={isActive ? 'white' : 'blueGreyDark'}
          style={{
            opacity: textOpacityAlwaysOn || isActive ? 1 : 0.2,
          }}
          letterSpacing="tighter"
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
  shouldRelaodList: PropTypes.bool,
  style: PropTypes.object,
  text: PropTypes.string,
  textOpacityAlwaysOn: PropTypes.bool,
};

export default CoinDividerEditButton;
