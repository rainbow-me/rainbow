import { accountUpdateAccountAddress } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { sortAssetsByNativeAmount } from '../helpers/assets';

const mapStateToProps = ({
  account: {
    accountInfo: {
      assets,
      total,
    },
    fetching,
    fetchingUniqueTokens,
    uniqueTokens,
  },
}) => ({
  assets,
  assetsTotalUSD: total,
  fetching,
  fetchingUniqueTokens,
  uniqueTokens,
});

const sortAssets = ({ assets }) => sortAssetsByNativeAmount(assets);

export default Component => compose(
  connect(mapStateToProps, { accountUpdateAccountAddress }),
  withProps(sortAssets),
)(Component);
