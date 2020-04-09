import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { sortAssetsByNativeAmountSelector } from './assetSelectors';

const mapStateToProps = ({
  data: { assetPricesFromUniswap, assets, loadingAssets },
  settings: { nativeCurrency },
}) => ({
  assetPricesFromUniswap,
  assets,
  loadingAssets,
  nativeCurrency,
});

const sortAssets = state => sortAssetsByNativeAmountSelector(state);

export default Component =>
  compose(connect(mapStateToProps), withProps(sortAssets))(Component);
