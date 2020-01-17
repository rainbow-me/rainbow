import React from 'react';
import { requireNativeComponent } from 'react-native';

const NativeButton = requireNativeComponent('Button');

export default class Button extends React.PureComponent {
  render() {
    return <NativeButton {...this.props}>{this.props.children}</NativeButton>;
  }
}
