import React, { Component } from 'react';
import { Image, View } from 'react-native';
import Label from '../components/Label';
import Section from '../components/Section';
import Text from '../components/Text';

class CoinRow extends Component {
  render() {
    const {
      imgPath, coinSymbol, coinName, coinBalance,
    } = this.props;
    return (
      <Section style={{ flexDirection: 'row', padding: 8 }}>
        <Image
          style={{
            width: 48,
            height: 48,
            resizeMode: 'contain',
            borderRadius: 24,
            backgroundColor: '#000',
          }}
          source={imgPath}
        />
        <View style={{ paddingLeft: 8, flexGrow: 1 }}>
          <Label>{coinName}</Label>
          <Text>{`${Number(coinBalance).toFixed(8)} ${coinSymbol}`}</Text>
        </View>
        <View style={{ paddingRight: 8, alignItems: 'flex-end' }}>
          <Text>{'$50.00'}</Text>
          <Text>{'1.58%'}</Text>
        </View>
      </Section>
    );
  }
}

// TODO: add prop types

export default CoinRow;
