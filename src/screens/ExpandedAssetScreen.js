import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import {
  AddContactState,
  InvestmentExpandedState,
  TokenExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { withNeverRerender } from '../hoc';
import { padding } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';

const {
  bottom: safeAreaBottom,
  top: safeAreaTop,
} = safeAreaInsetValues;

const ScreenTypes = {
  contact: AddContactState,
  token: TokenExpandedState,
  // eslint-disable-next-line camelcase
  unique_token: UniqueTokenExpandedState,
  uniswap: InvestmentExpandedState,
};

const ExpandedAssetScreen = withNeverRerender(({
  containerPadding,
  onPressBackground,
  type,
  ...props
}) => (
  <Centered
    {...deviceUtils.dimensions}
    css={padding(safeAreaTop, containerPadding, safeAreaBottom || safeAreaTop)}
    direction="column"
  >
    <TouchableBackdrop onPress={onPressBackground} />
    {createElement(ScreenTypes[type], props)}
  </Centered>
));

ExpandedAssetScreen.propTypes = {
  asset: PropTypes.object,
  containerPadding: PropTypes.number.isRequired,
  onPressBackground: PropTypes.func,
  panelWidth: PropTypes.number,
  type: PropTypes.oneOf(Object.keys(ScreenTypes)).isRequired,
};

ExpandedAssetScreen.defaultProps = {
  containerPadding: 15,
};

export default ExpandedAssetScreen;
