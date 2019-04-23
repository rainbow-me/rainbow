import PropTypes from 'prop-types';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import React from 'react';
import { StatusBar } from 'react-native';
import {
  compose,
  defaultProps,
  withHandlers,
  withProps,
  shouldUpdate,
} from 'recompact';
import { createSelector } from 'reselect';
import styled from 'styled-components/primitives';
import { TokenExpandedState, UniqueTokenExpandedState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { padding } from '../styles';
import { deviceUtils } from '../utils';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ containerPadding }) => padding(containerPadding)};
  background-color: transparent;
  height: 100%;
`;

const ExpandedAssetScreen = ({
  containerPadding,
  onPressBackground,
  panelWidth,
  type,
  ...props
}) => {
  const expandedStateProps = {
    ...props,
    panelWidth,
  };

  return (
    <Container containerPadding={containerPadding}>
      <StatusBar barStyle="light-content" />
      <TouchableBackdrop onPress={onPressBackground} />
      {type === 'token'
        ? <TokenExpandedState {...expandedStateProps} />
        : <UniqueTokenExpandedState {...expandedStateProps} />
      }
    </Container>
  );
};

ExpandedAssetScreen.propTypes = {
  asset: PropTypes.object,
  containerPadding: PropTypes.number.isRequired,
  onPressBackground: PropTypes.func,
  panelWidth: PropTypes.number,
  type: PropTypes.oneOf(['token', 'unique_token']),
};

const ExpandedAssetScreenDefaultProps = {
  containerPadding: 15,
};

ExpandedAssetScreen.defaultProps = ExpandedAssetScreenDefaultProps;

const containerPaddingSelector = state => state.containerPadding;
const navigationSelector = state => state.navigation;

const withExpandedAssets = (
  containerPadding,
  navigation,
) => {
  const { asset, type } = navigation.state.params;
  return {
    asset,
    panelWidth: deviceUtils.dimensions.width - (containerPadding * 2),
    type,
  };
};

const buildExpandedAssetsSelector = createSelector(
  [
    containerPaddingSelector,
    navigationSelector,
  ],
  withExpandedAssets,
);


export default compose(
  defaultProps(ExpandedAssetScreenDefaultProps),
  withAccountAssets,
  withProps(buildExpandedAssetsSelector),
  withHandlers({ onPressBackground: ({ navigation }) => () => navigation.goBack() }),
  shouldUpdate(() => false),
)(ExpandedAssetScreen);
