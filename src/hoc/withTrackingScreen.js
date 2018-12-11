import Piwik from 'react-native-matomo';
import { compose, lifecycle } from 'recompact';
import { getDisplayName } from 'recompose';

export default Component => compose(
  lifecycle({
    componentDidMount() {
      const displayName = getDisplayName(Component);
      Piwik.trackScreen(displayName, displayName);
    },
  }),
)(Component);
