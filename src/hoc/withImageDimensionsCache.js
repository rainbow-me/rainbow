import { connect } from 'react-redux';
import {
  pruneImageDimensionsCache,
  updateImageDimensionsCache,
} from '../redux/imageDimensionsCache';

const mapStateToProps = ({ imageDimensionsCache }) => ({
  imageDimensionsCache,
});

export default Component =>
  connect(mapStateToProps, {
    pruneCache: pruneImageDimensionsCache,
    updateCache: updateImageDimensionsCache,
  })(Component);
