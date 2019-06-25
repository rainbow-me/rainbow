import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { sortAssetsByNativeAmountSelector } from './assetSelectors';

const mapStateToProps = ({
  data: { assets },
  settings: { nativeCurrency },
}) => ({
  assets,
  nativeCurrency,
});

const sortAssets = (state) => sortAssetsByNativeAmountSelector(state);

export default Component => compose(
  connect(mapStateToProps),
  withProps(sortAssets),
)(Component);
