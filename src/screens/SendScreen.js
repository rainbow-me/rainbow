import React, { Component } from 'react';
import { Text, View } from 'react-native';

class SendScreen extends Component {
  static navigatorStyle = {
    navBarHidden: true,
    tabBarHidden: true,
  };

  render() {
    return (
      <View>
        <Text>{'Hi, I am a modal!'}</Text>
      </View>
    );
  }
}

export default SendScreen;
