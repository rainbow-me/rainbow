import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import SendScreen from './SendScreen';
import SwipeLayout from './SwipeLayout';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';

const AppStack = createStackNavigator({
  ConfirmTransaction: {
    screen: TransactionConfirmationScreenWithData,
    mode: 'modal',
    navigationOptions: {
      gesturesEnabled: false,
    },
  },
  SwipeLayout: {
    screen: SwipeLayout,
  },
  SendScreen: {
    screen: SendScreen,
  },
}, {
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  mode: 'modal',
});

const IntroStack = createStackNavigator({
  IntroScreen,
}, {
  headerMode: 'none',
  mode: 'card', // Horizontal gestures
});

export default createSwitchNavigator(
  {
    App: AppStack,
    Intro: IntroStack,
    Loading: LoadingScreen,
  },
  {
    headerMode: 'none',
    initialRouteName: 'Loading',
    mode: 'modal',
  },
);

