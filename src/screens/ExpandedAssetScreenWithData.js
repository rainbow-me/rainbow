import { withAccountAssets } from '@rainbow-me/rainbow-common';
import { get } from 'lodash';
import {
  compose,
  defaultProps,
  withHandlers,
  withProps,
} from 'recompact';
import { createSelector } from 'reselect';
import { withNeverRerender } from '../hoc';
import { deviceUtils } from '../utils';
import ExpandedAssetScreen from './ExpandedAssetScreen';

const containerPaddingSelector = state => state.containerPadding;
const navigationSelector = state => state.navigation;

const withExpandedAssets = (containerPadding, navigation) => ({
  ...get(navigation, 'state.params', {}),
  panelWidth: deviceUtils.dimensions.width - (containerPadding * 2),
});

const buildExpandedAssetsSelector = createSelector(
  [
    containerPaddingSelector,
    navigationSelector,
  ],
  withExpandedAssets,
);

export default compose(
  withAccountAssets,
  defaultProps(ExpandedAssetScreen.defaultProps),
  withProps(buildExpandedAssetsSelector),
  withHandlers({ onPressBackground: ({ navigation }) => () => navigation.goBack() }),
  withNeverRerender,
)(ExpandedAssetScreen);
