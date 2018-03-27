import React, { Component } from 'react';
import { Platform, StyleSheet, View, Text, Button } from 'react-native';
import * as EthWallet from '../model/ethWallet';
// import PropTypes from 'prop-types';

class TransactionScreen extends Component {
    // componentDidMount = async () => {
    //     // // Try to load an existing wallet
    //     // let wallet = await Wallet.loadWallet();
    //     //
    //     // if (!wallet) {
    //     //     // Create a new wallet
    //     //     wallet = await Wallet.createWallet();
    //     // }
    //     //
    //     // console.log(`wallet address: ${wallet.address}`);
    //     // console.log(`wallet private key: ${wallet.privateKey}`);
    //     // console.log(`wallet provider: ${wallet.provider}`);
    //     // console.log(`wallet seed phrase: ${Wallet.loadSeedPhrase()}`);
    //     await EthWallet.init();
    //     const addresses = EthWallet.getPublicAddresses();
    //     console.log(`addresses: ${addresses}`);
    //     const ethBalance = await EthWallet.getEthBalance(addresses[0]);
    //     console.log(`ethBalance: ${ethBalance}`);
    // };

    confirmTransaction = () => {};

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Confirm transaction from Balance Manager</Text>
                <Button onPress={this.confirmTransaction} title="Press to confirm" color="#841584" accessibilityLabel="Press to confirm" />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});

export default TransactionScreen;
