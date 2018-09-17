import { connect } from 'react-redux';

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
  ...rest
}) => ({
  assets,
  assetsCount: (assets || []).length,
  assetsTotalUSD: total,
  fetching,
  fetchingUniqueTokens,
  uniqueTokens,
});

export default Component => connect(mapStateToProps)(Component);
