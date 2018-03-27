import React, { Component } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import PropTypes from 'prop-types';
import * as EthWallet from '../model/ethWallet';

// TODO: Show full transaction info
// TODO: Skin using new designs
class TransactionScreen extends Component {
    constructor(props) {
        super(props);
        this.state = { confirmed: false, transactionText: JSON.stringify(props.transaction) };
    }

    confirmTransaction = async (transaction) => {
        const transactionHash = await EthWallet.sendTransaction(transaction);
        this.setState(previousState => ({ confirmed: true, transactionText: `Transaction sent!\n${transactionHash}` }));
    };

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.transaction}>{JSON.stringify(this.state.transactionText)}</Text>
                {!this.state.confirmed && (
                    <View>
                        <Text style={styles.title}>Confirm transaction from Balance Manager</Text>
                        <Button
                            onPress={() => {
                                this.confirmTransaction(this.props.transaction);
                            }}
                            title="Press to confirm"
                            color="#841584"
                            accessibilityLabel="Press to confirm"
                        />
                    </View>
                )}
            </View>
        );
    }
}

TransactionScreen.propTypes = {
    navigation: PropTypes.any,
    transaction: PropTypes.any,
};

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
    transaction: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});

export default TransactionScreen;
