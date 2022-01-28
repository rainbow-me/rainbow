declare module 'react-native-radial-gradient' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  interface RadialGradientProps {
    center: number[];
    colors: string[];
    radius: number;
    style?: StyleProp<ViewStyle>;
    stops: number[];
  }

  export default class RadialGradient extends Component<RadialGradientProps> {}
}
