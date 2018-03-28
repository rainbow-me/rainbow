import React, { Component } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Button from '../components/Button';
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
                            <StyledTransactionDetailText>
                                {this.props.fromName} • {this.props.fromAddress}
                            </StyledTransactionDetailText>
                            <StyledTransactionDetailSeparator />
                        </StyledTransactionDetailContainer>
                        <StyledTransactionDetailContainer>
                            <StyledTransactionDetailTitle>TO</StyledTransactionDetailTitle>
                            <StyledTransactionDetailText>
                                {this.props.toName} • {this.props.toAddress}
                            </StyledTransactionDetailText>
                            {this.props.isVerified && <StyledVerifiedBadge>Verified</StyledVerifiedBadge>}
                            <StyledTransactionDetailSeparator />
                        </StyledTransactionDetailContainer>
                        <StyledTransactionDetailContainer>
                            <StyledCurrencyNameText>{this.props.currencyName}</StyledCurrencyNameText>
                            <StyledAmountText>{this.props.amount}</StyledAmountText>
                            <StyledConvertedAmountText>{this.props.convertedAmount}</StyledConvertedAmountText>
                        </StyledTransactionDetailContainer>
                        <StyledConfirmButtonContainer>
                            <Button outline onPress={() => console.log('pressed')}>
                                Confirm with FaceID
                            </Button>
                        </StyledConfirmButtonContainer>
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

TransactionScreen.defaultProps = {
    fromName: 'My Wallet',
    fromAddress: '0xa4…d7A1',
    toName: 'CryptoKitties',
    toAddress: '0xb3…x2N9',
    isVerified: true,
    currencyName: '0x',
    amount: '17.92853 ZRX',
    convertedAmount: '$10.76',
};

const StyledContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: rgb(42, 38, 90);
`;

const StyledBottomContainer = styled.View`
    position: absolute;
    bottom: 0;
    align-self: flex-end;
    width: 100%;
    height: 367px;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    background-color: rgb(255, 255, 255);
`;

const StyledTransactionDetailContainer = styled.View`
    position: relative;
    width: 100%;
    height: 77px;
`;

const StyledTransactionDetailTitle = styled.Text`
    position: absolute;
    top: 19px;
    left: 18px;
    width: 38px;
    height: 14px;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: rgba(45, 45, 49, 0.7);
`;

const StyledTransactionDetailText = styled.Text`
    position: absolute;
    left: 18px;
    top: 38px;
    width: 176px;
    height: 19px;
    font-size: 16px;
    color: rgba(60, 66, 82, 0.6);
`;

const StyledTransactionDetailSeparator = styled.View`
    position: absolute;
    left: 18px;
    bottom: 0;
    width: 100%;
    height: 2px;
    background-color: rgba(230, 230, 230, 0.22);
`;

const StyledVerifiedBadge = styled.Text`
    position: absolute;
    top: 27px;
    right: 18px;
    padding: 3px 5px 3px 5px;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    color: rgb(255, 255, 255);
    border-radius: 6px;
    background-color: rgb(36, 127, 255);
    overflow: hidden;
`;

const StyledCurrencyNameText = styled.Text`
    position: absolute;
    left: 19px;
    top: 27px;
    width: 50%;
    height: 19px;
    font-size: 16px;
    font-weight: 600;
    color: rgb(45, 45, 49);
`;

const StyledAmountText = styled.Text`
    position: absolute;
    left: 19px;
    top: 53px;
    width: 50%;
    height: 16px;
    font-size: 14px;
    color: rgba(60, 66, 82, 0.6);
`;

const StyledConvertedAmountText = styled.Text`
    position: absolute;
    top: 28px;
    right: 20px;
    width: 50%;
    height: 36px;
    font-size: 30px;
    text-align: right;
    color: rgb(12, 12, 13);
`;

const StyledConfirmButtonContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

// const StyledConfirmButton = styled.Button`
//     width: 347px;
//     height: 59px;
//     border-radius: 14px;
//     background-color: rgb(0, 179, 113);
// `;

export default TransactionScreen;
