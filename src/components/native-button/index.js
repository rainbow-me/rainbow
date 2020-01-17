import React from 'react';
import { requireNativeComponent } from 'react-native';

const NativeButton = requireNativeComponent('Button');

export default class Button extends React.PureComponent {
  render() {
    return (
      <NativeButton style={this.props.style}>
        {this.props.children}
      </NativeButton>
    );
  }
}
