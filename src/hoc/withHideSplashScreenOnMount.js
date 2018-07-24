import SplashScreen from 'react-native-splash-screen';
import { lifecycle } from 'recompact';

export default Component => lifecycle({
  componentDidMount: () => SplashScreen.hide(),
})(Component);
