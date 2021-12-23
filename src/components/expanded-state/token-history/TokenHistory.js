import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import { apiGetNftSemiFungibility, apiGetNftTransactionHistoryForEventType } from '@rainbow-me/handlers/opensea-api';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { formatAssetForDisplay } from '@rainbow-me/helpers';
import { useAccountProfile, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { abbreviations } from '@rainbow-me/utils';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import Routes from '@rainbow-me/routes';
import logger from 'logger';
import { EventTypes, PaymentTokens } from '@rainbow-me/utils/tokenHistoryUtils';
import NetworkTypes from '@rainbow-me/networkTypes';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { Contract } from '@ethersproject/contracts';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  REVERSE_RECORDS_MAINNET_ADDRESS,
  reverseRecordsABI,
} from '@rainbow-me/references';

const Timeline = styled(View)`
  height: 3;
  background-color: ${({ color }) => color};
  opacity: 0.2;
  border-radius: 1.5;
  position: absolute;
  top: 3.5;
  left: 16;
  right: -11;
`;

const AccentText = styled(Text).attrs({
  size: 'smedium',
  weight: 'heavy',
})``;

const TokenHistory = ({ contract, token, color }) => {
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryShort, setTokenHistoryShort] = useState(false);
  const [contractAddress, setContractAddress] = useState(contract);
  const [tokenID, setTokenID] = useState(token);
  const { colors } = useTheme();
  const { accountAddress } = useAccountProfile();
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();

  const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;

  useEffect(() => {
    async function fetchTransactionHistory() {
      const semiFungible = await apiGetNftSemiFungibility(
        networkPrefix,
        contractAddress,
        tokenID
      );

      const [rawTransferEvents, rawSaleEvents] = await Promise.all(
        [
          apiGetNftTransactionHistoryForEventType(
            networkPrefix,
            semiFungible,
            accountAddress,
            contractAddress,
            tokenID,
            EventTypes.TRANSFER.type
          ),
          apiGetNftTransactionHistoryForEventType(
            networkPrefix,
            semiFungible,
            accountAddress,
            contractAddress,
            tokenID,
            EventTypes.SALE.type
          )
        ]
      );

      const rawEvents = rawTransferEvents.concat(rawSaleEvents);
      const txHistory = await processRawEvents(contractAddress, rawEvents);
      
      setTokenHistory(txHistory);
      if (txHistory.length <= 2) {
        setTokenHistoryShort(true);
      }
    }
    fetchTransactionHistory();
  }, [accountAddress, contractAddress, networkPrefix, tokenID]);

  const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

  const reverseRecordContract = new Contract(
    REVERSE_RECORDS_MAINNET_ADDRESS,
    reverseRecordsABI,
    web3Provider
  );

  const processRawEvents = async (contractAddress, rawEvents) => {
    rawEvents.sort((event1, event2) => event2.created_date.localeCompare(event1.created_date));
    let addressArray = new Array();
    let sales = [];
    const events = await rawEvents
      .map((event, index) => {
        let eventType = event.event_type;
        let createdDate = event.created_date;
        let saleAmount, paymentToken, toAccount, toAccountEthAddress;
  
        switch (eventType) {
          case EventTypes.TRANSFER.type:
            toAccountEthAddress = event.to_account?.address;
            if (event.from_account?.address === EMPTY_ADDRESS) {
              eventType = contractAddress === ENS_NFT_CONTRACT_ADDRESS ? EventTypes.ENS.type : EventTypes.MINT.type;
            }
            break;
  
          case EventTypes.SALE.type:
            sales.push(index);
            paymentToken =
              event.payment_token?.symbol === PaymentTokens.WETH
                ? PaymentTokens.ETH
                : event.payment_token?.symbol;
                
            const exactSaleAmount = formatAssetForDisplay({
              amount: parseInt(event.total_price).toString(),
              token: paymentToken,
            });
  
            saleAmount = handleSignificantDecimals(exactSaleAmount, 5);
            break;
        }
  
        if (toAccountEthAddress) {
          addressArray.push(toAccountEthAddress);
        }
  
        return {
          createdDate,
          eventType,
          paymentToken,
          saleAmount,
          toAccountEthAddress,
          toAccount
        };
      });

    // swap the order of every sale/transfer tx pair so sale is displayed before transfer
    sales.forEach((saleIndex) => {
      if (events.length != saleIndex + 1) {
        [events[saleIndex], events[saleIndex + 1]] = [events[saleIndex + 1], events[saleIndex]];
      }
    });
  
    let ensArray = await reverseRecordContract.getNames(addressArray);
    // let ensArray = ["jhfdlhlfhgfzklabhfgjkldjhfdlhlfhgfzklabhfgjkldahfjkleahfjdalhfgdjkafhjdakfdjhfdlhlfhgfzklabhfgjkldahfjkleahfjdalhfgdjkafhjdakfdahfjkleahfjdalhfgdjkafhjdakfd.eth"]
  
    const ensMap = ensArray.reduce(function(tempMap, ens, index) {
      tempMap[addressArray[index]] = ens;
      return tempMap;
    }, {});

    events.map((event) => {
      const address = event.toAccountEthAddress;
      if (address) {
        const ens = ensMap[address];
        event.toAccount = ens
          ? abbreviations.abbreviateEnsForDisplay(ens)
          : abbreviations.address(address, 2);
      }
    });

    if (events.length == 2) {
      events.reverse();
    }

    return events;
  };  

  const handlePress = useCallback(
    address => {
      navigate(Routes.SHOWCASE_SHEET, {
        address: address,
      });
    },
    [navigate]
  );

  const renderItem = ({ item, index }) => {
    let isFirst = index === 0;
    let suffixIcon = `􀆊`;
    let isClickable = false;
    let label, icon, suffix;

    switch (item?.eventType) {
      case EventTypes.ENS.type:
        label = 'Registered';
        icon = EventTypes.ENS.icon;
        break;

      case EventTypes.MINT.type:
        isClickable =
          accountAddress.toLowerCase() !== item.toAccountEthAddress;
        label = `Minted by ${item.toAccount}`;
        icon = EventTypes.MINT.icon;
        break;

      case EventTypes.SALE.type:
        label = `Sold for ${item.saleAmount} ${item.paymentToken}`;
        icon = EventTypes.SALE.icon;
        break;

      case EventTypes.TRANSFER.type:
        isClickable =
          accountAddress.toLowerCase() !== item.toAccountEthAddress;
        label = `Sent to ${item.toAccount}`;
        icon = EventTypes.TRANSFER.icon;
        break;

      default:
        break;
    }
    return renderHistoryDescription({
      icon,
      isClickable,
      isFirst,
      item,
      label,
      suffix,
      suffixIcon,
    });
  };

  const renderHistoryDescription = ({
    icon,
    isClickable,
    isFirst,
    item,
    label,
    suffixIcon,
  }) => {
    const date = getHumanReadableDateWithoutOn(
      new Date(item.createdDate).getTime() / 1000
    );

    return (
      <Column>
        {tokenHistory.length > 1 &&
          <Row style={tokenHistory.length == 2 ? {height: 10, marginBottom: 6, marginTop: 4, paddingLeft: 19} : {height: 10, marginBottom: 6, marginTop: 4, paddingRight: 19}}>
            <View style={{width: 10, height: 10, borderRadius: 10 / 2, backgroundColor: color}} />
            {((!isFirst && tokenHistory.length != 2) || (isFirst && tokenHistory.length == 2)) && <Timeline style={tokenHistory.length == 2 ? {marginLeft: 19} : {marginRight: 19}} color={color} />}
          </Row>
        }  
        <Column style={tokenHistory.length <= 2 ? { paddingLeft: 19 } : { paddingRight: 19 }}>
          <Row style={{ marginBottom: 3 }}>
            <AccentText color={color}>{date}</AccentText>
          </Row>
          <ButtonPressAnimation
            disabled={!isClickable}
            hapticType="selection"
            onPress={() => handlePress(item.toAccountEthAddress)}
            scaleTo={0.92}
          >
            <Row>
              <AccentText color={color}>{icon}</AccentText>
              <AccentText style={{marginLeft: 2}} color={colors.whiteLabel}>
                {label}
                {isClickable && suffixIcon}
              </AccentText>
            </Row>
          </ButtonPressAnimation>
        </Column>
      </Column>
    );
  };

  const renderTwoOrLessDataItems = () => {
    return (
      <Row style={{ marginLeft: 19 }}>
        {tokenHistory.length == 2 && renderItem({ index: 1, item: tokenHistory[1] })}
        {renderItem({ index: 0, item: tokenHistory[0] })}
      </Row>
    );
  };

  const renderFlatList = () => {
    return (
      <MaskedView maskElement={<TokenHistoryEdgeFade />}>
        <FlatList
          ListFooterComponent={<View style={tokenHistory.length <= 2 ? { paddingLeft: 19} : { paddingRight: 19}} />}
          data={tokenHistory}
          horizontal
          inverted={tokenHistory.length <= 2 ? false : true }
          renderItem={({ item, index }) => renderItem({ index, item })}
          showsHorizontalScrollIndicator={false}
        />
      </MaskedView>
    );
  };

  return (
    <>
      {tokenHistoryShort ? renderFlatList() : renderFlatList()}
    </>
  );
};

export default TokenHistory;