import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { sortAssetsByNativeAmount } from '../helpers/assets';

const mapStateToProps = ({
  assets: {
    assets,
    fetchingAssets,
    fetchingUniqueTokens,
    uniqueTokens,
  },
  prices: { prices },
  settings: { nativeCurrency },
}) => ({
  assets,
  fetchingAssets,
  fetchingUniqueTokens,
  nativeCurrency,
  prices,
  uniqueTokens,
});

const sortAssets = ({ assets, nativeCurrency, prices }) => sortAssetsByNativeAmount(assets, prices, nativeCurrency);

export default Component => compose(
  connect(mapStateToProps),
  withProps(sortAssets),
)(Component);
