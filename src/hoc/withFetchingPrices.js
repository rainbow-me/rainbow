import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';

const mapStateToProps = ({ prices: { fetchingPrices } }) => ({ fetchingPrices });

export default Component => compose(
  connect(mapStateToProps),
)(Component);
