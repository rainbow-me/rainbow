import React, { Component } from 'react';
import { Button, Image, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import Label from '../components/Label';
import Section from '../components/Section';
import Text from '../components/Text';
import { ellipseAddress } from '../helpers/utilities';

import Tabs from './tabs/Tabs';

class WalletMenu extends Component {
  onPress = () => null;
  render() {
    const { walletAddress } = this.props;
    return (
      <Card style={{ paddingTop: 50 }}>
        <Section style={{ flexDirection: 'row' }}>
          <View style={{ flexGrow: 1 }}>
            <View style={{ flexDirection: 'row' }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: '#3BC08F',
                  borderRadius: 5,
                  marginRight: 4,
                }}
              />
              <Label style={{ color: 'rgba(0,0,0,.54)', fontWeight: '300', marginBottom: 0 }}>{'Main Network'}</Label>
            </View>
            <Text style={{ color: 'rgba(0,0,0,.87)', fontWeight: '300', fontSize: 22 }}>{ellipseAddress(walletAddress, 20)}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={this.onPress} accessibilityLabel="Transaction">
              <Image style={{ width: 60, height: 60 }} source={require('../assets/transaction-button.png')} />
            </TouchableOpacity>
            <TouchableOpacity onPress={this.onPress} accessibilityLabel="Send">
              <Image style={{ width: 60, height: 60 }} source={require('../assets/send-button.png')} />
            </TouchableOpacity>
          </View>
        </Section>
        <Tabs
          items={this.props.tabItems}
          onChange={this.props.onTabChange}
          selectedTab={this.props.selectedTab}
        />
      </Card>
    );
  }
}

// TODO: add prop types

export default WalletMenu;
