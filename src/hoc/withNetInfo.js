import NetInfo from '@react-native-community/netinfo';
import {
  compose,
  lifecycle,
  withState,
} from 'recompact';

const withNetInfo = ComponentToWrap => compose(
  withState('isConnected', 'setIsConnected', true),
  lifecycle({
    componentDidMount() {
      NetInfo.isConnected.addEventListener('connectionChange', this.props.setIsConnected);
    },
    componentWillUnmount() {
      NetInfo.isConnected.removeEventListener('connectionChange', this.props.setIsConnected);
    },
  }),
)(ComponentToWrap);

export default withNetInfo;
