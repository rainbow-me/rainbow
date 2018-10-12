import { accountUpdateAccountAddress } from 'balance-common';
import { connect } from 'react-redux';

const EMPTY_ARRAY = [];

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
  assetsCount: (assets || EMPTY_ARRAY).length,
  assetsTotalUSD: total,
  fetching,
  fetchingUniqueTokens,
  uniqueTokens,
});

export default Component => connect(mapStateToProps, { accountUpdateAccountAddress })(Component);
