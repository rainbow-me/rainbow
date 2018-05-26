import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Navigation } from 'react-native-navigation';
import Button from '../components/Button';
import * as ethWallet from '../model/ethWallet';
import { getTransactionToApprove } from '../model/transactions';
import { walletConnectSendTransactionHash } from '../model/walletconnect';

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

const StyledConfirmButtonContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const SCloseModal = styled.Text`
  color: #5376ff;
  font-size: 17px;
  position: absolute;
  top: 15px;
  right: 17px;
`;

class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { confirmed: false, transaction: null };
  }

  componentDidMount() {
    this.showNewTransaction();
  }

  showNewTransaction = () => {
    const transaction = getTransactionToApprove();
    console.log('transaction', transaction);
    this.setState({ transaction });
  };

  confirmTransaction = async () => {
    const { transaction } = this.state;
    const transactionReceipt = await ethWallet.sendTransaction(transaction.transactionData);
    if (transactionReceipt && transactionReceipt.hash) {
      await walletConnectSendTransactionHash(transaction.transactionId, true, transactionReceipt.hash);
      this.setState(previousState => ({ confirmed: true, transaction: null }));
    } else {
      await walletConnectSendTransactionHash(false, null);
      this.setState(previousState => ({ confirmed: false }));
    }
  };

  onClose() {
    Navigation.dismissModal({
      animationType: 'slide-down',
    });
  }

  render() {
    return (
      <StyledContainer>
        {!this.state.confirmed &&
          this.state.transaction && (
          <StyledBottomContainer>
            <StyledTransactionDetailContainer>
              <StyledTransactionDetailTitle>FROM</StyledTransactionDetailTitle>
              <StyledTransactionDetailText>{this.state.transaction.transactionData.from}</StyledTransactionDetailText>
              <SCloseModal onPress={this.onClose}>Cancel</SCloseModal>
              <StyledTransactionDetailSeparator />
            </StyledTransactionDetailContainer>
            <StyledTransactionDetailContainer>
              <StyledTransactionDetailTitle>TO</StyledTransactionDetailTitle>
              <StyledTransactionDetailText>{this.state.transaction.transactionData.to}</StyledTransactionDetailText>
              <StyledTransactionDetailSeparator />
            </StyledTransactionDetailContainer>
            <StyledTransactionDetailContainer>
              <StyledCurrencyNameText>{this.props.currencyName}</StyledCurrencyNameText>
              <StyledAmountText>{this.state.transaction.transactionData.value}</StyledAmountText>
              {/* <StyledConvertedAmountText>{this.props.convertedAmount}</StyledConvertedAmountText> */}
            </StyledTransactionDetailContainer>
            <StyledConfirmButtonContainer>
              <Button outline onPress={() => this.confirmTransaction()}>
                  Confirm with TouchID
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
  convertedAmount: PropTypes.string,
  currencyName: PropTypes.string,
};

TransactionScreen.defaultProps = {
  fromAddress: 'fake address',
  toAddress: 'fake address',
  currencyName: 'AVO',
  convertedAmount: 'TBD',
};

export default TransactionScreen;
