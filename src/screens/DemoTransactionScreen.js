import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Button from '../components/Button';

const SContainer = styled.View`
  flex: 1;
  background-color: rgb(0, 0, 0);
`;

const STopContainer = styled.View`
  padding-top: 120px;
  justify-content: center;
  align-items: center;
`;

const SVendorLogo = styled.Image`
  width: 25px;
  height: 40px;
  margin: 0 auto;
  align-self: stretch;
`;

const SVendorName = styled.Text`
  margin-top: 16px;
  font-size: 19px;
  margin-bottom: 4px;
  color: rgb(255, 255, 255);
`;

const SRequestPayment = styled.Text`
  color: rgb(255, 255, 255);
  font-size: 17px;
  opacity: 0.6;
`;

const SBottomContainer = styled.View`
  position: absolute;
  bottom: 0;
  align-self: flex-end;
  width: 100%;
  height: 367px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background-color: rgb(255, 255, 255);
`;

const STransactionDetailContainer = styled.View`
  position: relative;
  width: 100%;
  height: 77px;
`;

const STransactionDetailTitle = styled.Text`
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

const STransactionDetailText = styled.Text`
  position: absolute;
  left: 18px;
  top: 38px;
  width: 176px;
  height: 19px;
  font-size: 16px;
  color: rgba(60, 66, 82, 0.6);
`;

const STransactionDetailSeparator = styled.View`
  position: absolute;
  left: 18px;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: rgba(230, 230, 230, 0.22);
`;

const SCurrencyNameText = styled.Text`
  position: absolute;
  left: 19px;
  top: 27px;
  width: 50%;
  height: 19px;
  font-size: 16px;
  font-weight: 600;
  color: rgb(45, 45, 49);
`;

const SAmountText = styled.Text`
  position: absolute;
  left: 19px;
  top: 53px;
  width: 50%;
  height: 16px;
  font-size: 14px;
  color: rgba(60, 66, 82, 0.6);
`;

const SConfirmButtonContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

class TransactionScreen extends Component {
  render() {
    return (
      <SContainer>
        <STopContainer>
          {/* eslint-disable-next-line */}
          <SVendorLogo source={require('../assets/ethereum.png')} />
          <SVendorName>{'Ethereum Store'}</SVendorName>
          <SRequestPayment>{'Request for Payment'}</SRequestPayment>
        </STopContainer>
        <SBottomContainer>
          <STransactionDetailContainer>
            <STransactionDetailTitle>FROM</STransactionDetailTitle>
            <STransactionDetailText>{'0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb'}</STransactionDetailText>
            <STransactionDetailSeparator />
          </STransactionDetailContainer>
          <STransactionDetailContainer>
            <STransactionDetailTitle>TO</STransactionDetailTitle>
            <STransactionDetailText>{'0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb'}</STransactionDetailText>
            <STransactionDetailSeparator />
          </STransactionDetailContainer>
          <STransactionDetailContainer>
            <SCurrencyNameText>{'ETH'}</SCurrencyNameText>
            <SAmountText>{'0.1000'}</SAmountText>
          </STransactionDetailContainer>
          <SConfirmButtonContainer>
            <Button onPress={() => this.confirmTransaction()}>Confirm with TouchID</Button>
          </SConfirmButtonContainer>
        </SBottomContainer>
      </SContainer>
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
