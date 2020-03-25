import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components/primitives';
import { View } from 'react-native';
import { compose } from 'recompact';
import { CoinIcon } from '../coin-icon';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { withCoinRecentlyPinned } from '../../hoc';
import withCoinListEdited from '../../hoc/withCoinListEdited';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const Centered = styled.View`
  align-items: center;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

const CircleOutline = styled.View`
  border-color: ${colors.blueGreyDark};
  border-radius: 11;
  border-width: 1.5;
  height: 22;
  opacity: 0.15;
  position: absolute;
  width: 22;
`;

const CheckmarkBackground = styled.View`
  background-color: ${colors.appleBlue};
  border-radius: 11;
  height: 22;
  padding-top: 4.5;
  padding-left: 4.5;
  padding-right: 4.5;
  padding-bottom: 4.5;
  shadow-color: ${colors.appleBlue};
  shadow-offset: {width: 0, height: 4};
  shadow-opacity: 0.4;
  shadow-radius: 12;
  width: 22;
`;

const CoinCheckButton = ({
  isAbsolute,
  uniqueId,
  pushSelectedCoin,
  removeSelectedCoin,
  isCoinListEdited,
  recentlyPinnedCount,
}) => {
  const [toggle, setToggle] = useState(false);
  const [previousPinned, setPreviousPinned] = useState(0);

  useEffect(() => {
    if (toggle && (recentlyPinnedCount > previousPinned || !isCoinListEdited)) {
      setPreviousPinned(recentlyPinnedCount);
      setToggle(false);
    }
  }, [isCoinListEdited, recentlyPinnedCount]);

  return (
    <View
      style={{
        height: CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom,
        position: isAbsolute ? 'absolute' : 'relative',
        width: 66,
      }}
    >
      <ButtonPressAnimation
        onPress={() => {
          if (toggle) {
            removeSelectedCoin(uniqueId);
          } else {
            pushSelectedCoin(uniqueId);
          }
          setToggle(!toggle);
        }}
      >
        <Centered>
          <CircleOutline />
          <OpacityToggler isVisible={!toggle}>
            <CheckmarkBackground>
              <Icon name="checkmark" color="white" />
            </CheckmarkBackground>
          </OpacityToggler>
        </Centered>
      </ButtonPressAnimation>
    </View>
  );
};

CoinCheckButton.propTypes = {
  isAbsolute: PropTypes.bool,
};

CoinCheckButton.defaultProps = {};

export default React.memo(
  compose(withCoinRecentlyPinned, withCoinListEdited)(CoinCheckButton)
);
