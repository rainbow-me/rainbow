import { filter } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import { compose, defaultProps, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { TokenExpandedState, UniqueTokenExpandedState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { withAccountAssets } from '../hoc';
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

export default compose(
  defaultProps(ExpandedAssetScreenDefaultProps),
  withAccountAssets,
  withProps(({
    allAssets,
    containerPadding,
    navigation,
    uniqueTokens,
  }) => {
    const { name, type } = navigation.state.params;

    let selectedAsset = {};

    if (type === 'token') {
      [selectedAsset] = filter(allAssets, (asset) => asset.symbol === name);
    } else if (type === 'unique_token') {
      [selectedAsset] = filter(uniqueTokens, (asset) => asset.name === name);
    }

    return {
      asset: selectedAsset,
      panelWidth: deviceUtils.dimensions.width - (containerPadding * 2),
      type,
    };
  }),
  withHandlers({
    onPressBackground: ({ navigation }) => () => navigation.goBack(),
  }),
)(ExpandedAssetScreen);

