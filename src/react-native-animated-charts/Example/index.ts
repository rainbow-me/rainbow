import {AppRegistry} from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './App' was resolved to '/Users/nickbytes/r... Remove this comment to see the full error message
import App from './App';
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module './app.json'. Consider using '-... Remove this comment to see the full error message
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
