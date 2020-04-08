import { connect } from 'react-redux';
import { popShowcaseToken, pushShowcaseToken } from '../redux/showcaseTokens';

const mapStateToProps = ({ showcaseTokens: { showcaseTokens } }) => ({
  showcaseTokens,
});

export default Component =>
  connect(mapStateToProps, {
    popShowcaseToken,
    pushShowcaseToken,
  })(Component);
