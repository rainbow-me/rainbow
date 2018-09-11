import React from 'react';
import { Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import lang from 'react-native-i18n';

const SendScreen = ({ sections }) => (
  <View style={styles.container}>
    <View style={styles.card}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 16,
        }}
      >
        <Button
          onPress={this.closeModal}
          title={lang.t('wallet.action.cancel')}
          color="#5983FF"
          accessibilityLabel={lang.t('wallet.action.cancel')}
          style={{ fontSize: 18 }}
        />
        <Text style={{ fontSize: 18, fontWeight: '600' }}>{lang.t('wallet.action.send')}</Text>
        <Image style={{ width: 20, height: 20, marginLeft: 34 }} source={require('../assets/scan-icon-alt.png')} />
      </View>
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
          placeholder="Address, Name, Phone"
        />
        <TouchableOpacity onPress={this.pasteContent} style={{ backgroundColor: '#A9ADB9', borderRadius: 14, padding: 6 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{lang.t('wallet.action.paste')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

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

export default SendScreen;
