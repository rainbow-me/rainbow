import React, { Component } from 'react';
import { Button, Image, Text, TextInput, View } from 'react-native';
import Label from '../components/Label';
import Section from '../components/Section';

class SendScreen extends Component {
  state = {
    text: '',
  };
  static navigatorStyle = {
    navBarHidden: true,
    tabBarHidden: true,
  };

  closeModal = () =>
    this.props.navigator.dismissModal({
      animationType: 'slide-up',
    });

  render() {
    const exponent = 10 ** Number(18);
    const balance = Number(131665566299068734) / exponent;
    return (
      <View
        style={{
          marginTop: 50,
          justifyContent: 'flex-end',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button onPress={this.closeModal} title="Cancel" color="#5983FF" accessibilityLabel="Cancel" style={{ fontSize: 18 }} />
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{'Send'}</Text>
          <Image style={{ width: 60, height: 60 }} source={require('../assets/send-button.png')} />
        </View>
        <Section
          style={{
            flexDirection: 'row',
            padding: 8,
            alignItems: 'stretch',
            width: '100%',
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0, 0.1)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0, 0.1)',
          }}
        >
          <Image
            style={{
              width: 48,
              height: 48,
              resizeMode: 'contain',
              borderRadius: 24,
            }}
            source={{ uri: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png' }}
          />
          <View style={{ paddingLeft: 8, flexGrow: 1 }}>
            <Label style={{ width: '100%' }}>{'Ethereum'}</Label>
            <Text>{'$5,678'}</Text>
          </View>
          <View style={{ paddingRight: 8, alignItems: 'flex-end' }}>
            <Text>{'>'}</Text>
          </View>
        </Section>
        <View flexDirection="row">
          <Image style={{ width: 20, height: 20 }} source={require('../assets/person-icon.png')} />
          <TextInput
            style={{ height: 40 }}
            onChangeText={text => this.setState({ text })}
            value={this.state.text}
            clearTextOnFocus={true}
            placeholder="Address, Name, Phone"
          />
        </View>
      </View>
    );
  }
}

export default SendScreen;
