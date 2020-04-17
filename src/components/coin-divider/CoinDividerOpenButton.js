import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { colors } from '../../styles';
import {
  OpacityToggler,
  ButtonPressAnimation,
  RotationArrow,
  RoundButtonSizeToggler,
} from '../animations';
import Caret from '../../assets/family-dropdown-arrow.png';
import FastImage from 'react-native-fast-image';
import CoinDividerButtonLabel from './CoinDividerButtonLabel';
import { Row } from '../layout';

const CoinDividerOpenButton = ({
  assetsAmount,
  coinDividerHeight,
  initialState,
  isCoinListEdited,
  node,
  openSmallBalances,
  setOpenSmallBalances,
}) => (
  <ButtonPressAnimation
    onPress={() => setOpenSmallBalances(!openSmallBalances)}
    scaleTo={0.9}
    style={{ width: openSmallBalances ? 80 : 52.5 }}
  >
    <OpacityToggler
      endingOpacity={0}
      startingOpacity={1}
      isVisible={isCoinListEdited || assetsAmount === 0}
    >
      <Row
        align="center"
        borderRadius={RoundButtonSizeToggler.capSize / 2}
        height={coinDividerHeight}
        justify="space-between"
        width={52.5}
        paddingHorizontal={10}
      >
        <RoundButtonSizeToggler
          animationNode={node}
          endingWidth={28}
          isAbsolute
          reversed={!initialState}
          startingWidth={3}
          toggle={openSmallBalances}
        />
        <View>
          <CoinDividerButtonLabel
            isVisible={openSmallBalances}
            label="All"
            node={node}
            steps={[1, 0]}
          />
          <CoinDividerButtonLabel
            isVisible={openSmallBalances}
            label="Less"
            node={node}
            steps={[0, 1]}
          />
        </View>
        <View style={{ opacity: 0.6, paddingBottom: 1 }}>
          <RotationArrow
            endingOffset={20}
            endingPosition={-90}
            isOpen={openSmallBalances}
          >
            <FastImage
              source={Caret}
              style={{ height: 17, width: 9 }}
              tintColor={colors.blueGreyDark}
            />
          </RotationArrow>
        </View>
      </Row>
    </OpacityToggler>
  </ButtonPressAnimation>
);

CoinDividerOpenButton.propTypes = {
  assetsAmount: PropTypes.number,
  coinDividerHeight: PropTypes.number,
  initialState: PropTypes.object,
  isCoinListEdited: PropTypes.bool,
  node: PropTypes.object,
  openSmallBalances: PropTypes.bool,
  setOpenSmallBalances: PropTypes.func,
};

export default CoinDividerOpenButton;
