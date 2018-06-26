import React, { Component } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

class DappCard extends Component {
  render() {
    const { dappName, dappImage, dappText } = this.props;
    return (
      <View style={styles.dappCard}>
        <Text style={[styles.dappName, styles.centerText]}>{dappName}</Text>
        <Image style={styles.dappImage} source={dappImage} />
        {dappText && <Text style={[styles.dappText, styles.centerText]}>{dappText}</Text>}
      </View>
    );
  }
}

// TODO: add prop types

const styles = StyleSheet.create({
  centerText: {
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  textDefault: {
    fontSize: 16,
    paddingTop: 24,
    color: 'rgba(0,0,0,0.54)',
  },
  dappCard: {
    borderColor: '#E8E6E6',
    borderStyle: 'solid',
    borderWidth: 0.5,
    padding: 8,
    backgroundColor: '#FCFCFC',
    borderRadius: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  dappName: {
    fontSize: 12,
    color: '#3B99FC',
    paddingTop: 0,
  },
  dappImage: {
    height: 100,
    width: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  dappText: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.54)',
  },
});

export default DappCard;
