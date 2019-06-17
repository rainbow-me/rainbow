import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import { TokenExpandedState, UniqueTokenExpandedState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { padding } from '../styles';
import { safeAreaInsetValues } from '../utils';

const {
  bottom: safeAreaBottom,
  top: safeAreaTop,
} = safeAreaInsetValues;

const ExpandedAssetScreen = ({
  containerPadding,
  onPressBackground,
  type,
  ...props
}) => (
  <Centered
    css={padding(safeAreaTop, containerPadding, safeAreaBottom || safeAreaTop)}
    direction="column"
    height="100%"
  >
    <StatusBar barStyle="light-content" />
    <TouchableBackdrop onPress={onPressBackground} />
    {type === 'token'
      ? <TokenExpandedState {...props} />
      : <UniqueTokenExpandedState {...props} />
    }
  </Centered>
);

ExpandedAssetScreen.propTypes = {
  asset: PropTypes.object,
  containerPadding: PropTypes.number.isRequired,
  onPressBackground: PropTypes.func,
  panelWidth: PropTypes.number,
  type: PropTypes.oneOf(['token', 'unique_token']),
};

ExpandedAssetScreen.defaultProps = {
  containerPadding: 15,
};

export default ExpandedAssetScreen;
