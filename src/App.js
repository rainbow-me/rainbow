import React, { Component } from 'react';
import {
  AppRegistry,
  AppState,
  Linking,
  LogBox,
  NativeModules,
  StatusBar,
} from 'react-native';

import Animatable from './AnimatedNumbers';

AppRegistry.registerComponent('Rainbow', () => Animatable);
