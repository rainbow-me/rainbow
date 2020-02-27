import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { View } from 'react-native';
import { pure } from 'recompact';
import { CoinIcon } from '../coin-icon';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { colors } from '../../styles';
import { Icon } from '../icons';

const CoinRowPaddingTop = 15;
const CoinRowPaddingBottom = 7;

const CoinCheckButton = ({ isAbsolute }) => {
  const [toggle, setToggle] = useState(false);

  return (
    <View
      style={{
        height: CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom,
        paddingTop: 10,
        position: isAbsolute ? 'absolute' : 'relative',
        width: 66,
      }}
    >
      <ButtonPressAnimation onPress={() => setToggle(!toggle)}>
        <View
          style={{
            alignItems: 'center',
            height: '100%',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <View
            style={{
              borderColor: colors.blueGreyDarkTransparent,
              borderRadius: 11,
              borderWidth: 1.5,
              height: 22,
              opacity: 0.15,
              position: 'absolute',
              width: 22,
            }}
          />
          <OpacityToggler isVisible={!toggle}>
            <View
              style={{
                backgroundColor: colors.appleBlue,
                borderRadius: 11,
                height: 22,
                padding: 4.5,
                shadowColor: colors.appleBlue,
                shadowOffset: {
                  height: 4,
                  width: 0,
                },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                width: 22,
              }}
            >
              <Icon name="checkmark" color="white" />
            </View>
          </OpacityToggler>
        </View>
      </ButtonPressAnimation>
    </View>
  );
};

CoinCheckButton.propTypes = {
  isAbsolute: PropTypes.bool,
};

CoinCheckButton.defaultProps = {};

export default pure(CoinCheckButton);
