import React, { Component } from 'react';
import { Button, Image, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  pasteContent = () => null;

  render() {
    const exponent = 10 ** Number(18);
    const balance = Number(131665566299068734) / exponent;
    return (
      <View style={styles.container}>
        <View style={styles.card}>
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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginLeft: 16,
              marginRight: 16,
            }}
          >
            <Image style={{ width: 20, height: 20 }} source={require('../assets/person-icon.png')} />
            <TextInput
              style={{ height: 40, flexGrow: 1, marginLeft: 8 }}
              onChangeText={text => this.setState({ text })}
              value={this.state.text}
              clearTextOnFocus={true}
              placeholder="Address, Name, Phone"
            />
            <TouchableOpacity onPress={this.pasteContent} style={{ backgroundColor: '#A9ADB9', borderRadius: 14, padding: 6 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{'Paste'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <SectionList
          renderItem={({ item, index, section }) => (
            <Section
              key={index}
              style={{
                flexDirection: 'row',
                padding: 8,
                alignItems: 'stretch',
                width: '100%',
              }}
            >
              <Image
                style={{
                  width: 48,
                  height: 48,
                  resizeMode: 'contain',
                  borderRadius: 24,
                }}
                source={{ uri: item.image }}
              />
              <View style={{ paddingLeft: 8, flexGrow: 1 }}>
                <Label style={{ width: '100%' }}>{item.name}</Label>
                <Text>{item.text}</Text>
              </View>
            </Section>
          )}
          renderSectionHeader={({ section: { title } }) => <Text style={{ fontWeight: 'bold' }}>{title}</Text>}
          sections={sections}
          keyExtractor={(item, index) => item + index}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    backgroundColor: '#F7F8FA',
  },
  card: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    backgroundColor: '#fff',
  },
});

const sections = [
  {
    title: '',
    data: [
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
    ],
  },
  {
    title: 'A',
    data: [
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
    ],
  },
  {
    title: 'B',
    data: [
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
      {
        name: 'Ethereum',
        image: 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png',
        text: 'sometext',
      },
    ],
  },
];

export default SendScreen;
