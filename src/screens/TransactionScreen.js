import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';
import PropTypes from 'prop-types';
import Styled from 'styled-components';
import * as ethWallet from '../model/ethWallet';

// TODO: Show full transaction info
// TODO: Skin using new designs
class TransactionScreen extends Component {
    constructor(props) {
        super(props);
        this.state = { confirmed: false, transactionText: JSON.stringify(props.transaction) };
    }

    confirmTransaction = async (transaction) => {
        // const transactionHash = await ethWallet.sendTransaction(transaction);
        // this.setState(previousState => ({ confirmed: true, transactionText: `Transaction sent!\n${transactionHash}` }));
        this.setState(previousState => ({ confirmed: true, transactionText: 'Transaction sent!' }));
    };

    render() {
        return (
            <StyledContainer>
                {!this.state.confirmed && (
                    <StyledBottomContainer>
                        <StyledTransactionDetailContainer>
                            <StyledTransactionDetailTitle>FROM</StyledTransactionDetailTitle>
                            <StyledTransactionDetailText>My Wallet • 0xa4…d7A1</StyledTransactionDetailText>
                            <StyledTransactionDetailSeparator />
                        </StyledTransactionDetailContainer>
                        <StyledTransactionDetailContainer>
                            <StyledTransactionDetailTitle>TO</StyledTransactionDetailTitle>
                            <StyledTransactionDetailText>CryptoKitties • 0xb3…x2N9</StyledTransactionDetailText>
                            <StyledVerifiedBadge>Verified</StyledVerifiedBadge>
                            <StyledTransactionDetailSeparator />
                        </StyledTransactionDetailContainer>
                    </StyledBottomContainer>
                )}
            </StyledContainer>
        );
    }
}

TransactionScreen.propTypes = {
    navigation: PropTypes.any,
    transaction: PropTypes.any,
};

const StyledContainer = Styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: #2a265a;
`;

const StyledBottomContainer = Styled.View`
    position: absolute;
    bottom: 0;
    align-self: flex-end;
    width: 100%;
    height: 367px;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    background-color: #ffffff;
`;

const StyledTransactionDetailContainer = Styled.View`
    position: relative;
    width: 100%;
    height: 77px;
`;

const StyledTransactionDetailTitle = Styled.Text`
    position: absolute;
    top: 19px;
    left: 18px;
    width: 38px;
    height: 14px;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: #6c6c6e;
`;

const StyledTransactionDetailText = Styled.Text`
    position: absolute;
    left: 18px;
    top: 38px;
    width: 176px;
    height: 19px;
    font-size: 16px;
    font-weight: normal;
    text-align: left;
    color: #8a8e97;
`;

const StyledTransactionDetailSeparator = Styled.View`
    position: absolute;
    left: 18px;
    bottom: 0;
    width: 100%;
    height: 2px;
    background: #f9f9f9;
`;

const StyledVerifiedBadge = Styled.Text`
    position: absolute;
    top: 27px;
    right: 18px;
    padding: 3px 5px 3px 5px;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    color: #ffffff;
    border-radius: 6px;
    background-color: #247fff;
    overflow: hidden;
`;

export default TransactionScreen;
