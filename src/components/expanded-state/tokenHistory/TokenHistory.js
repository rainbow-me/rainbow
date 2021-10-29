import React, { useEffect, useState } from 'react';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList, View } from "react-native";
import logger from 'logger';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../../text';
import styled from 'styled-components';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useTheme } from '../../../context/ThemeContext';
import { useAddressToENS } from '@rainbow-me/hooks';
import { isHexString } from '@ethersproject/bytes';
import { abbreviations } from '../../../utils';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings - Cancelled Listings
 * Scrollable horizonatally
 */

const eventTypes = {
  SALE: 'successful',
  TRANSFER: 'transfer',
  LIST: 'created',
  DELIST: 'cancelled',
  MINT: 'mint',
};

const eventPhrases  = {
  SALE: `Sold for `,
  LIST: `Listed for `,
  TRANSFER: `Sent to `,
  DELIST: `Delisted`,
  MINT:`Minted`,
};

const eventSymbols = {
  SALE: `􀋢`,
  LIST: `􀎧`,
  TRANSFER: `􀈠`,
  DELIST: `􀎩`,
  MINT: `􀎛`,
};

const TokenHistory = ({ 
    contractAndToken,
    color
  }) => {

  const [tokenHistory, setTokenHistory] = useState([]);
  const [contractAddress, setContractAddress] = useState("");
  const [tokenID, setTokenID] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(async() => {
    const tokenInfoArray = contractAndToken.split("/");
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(async() => {
    await apiGetTokenHistory(contractAddress, tokenID)
    .then(data => {
      setTokenHistory(data);
      setIsLoading(false);
    });
  }, [contractAddress, tokenID]);

  // const setDataAddresses = async(data) => {
  //   var newData;

  //   for await (const item of data) {
  //     if (item.event_type == eventTypes.TRANSFER) {
  //       const newAddy = await getAddress(item.to_account)
  //       newData.push({
  //         event_type: item.event_type,
  //         created_date: item.created_date,
  //         from_account: item.from_account,
  //         to_account: newAddy,
  //         sale_amount: item.sale_amount,
  //         list_amount: list_amount
  //       });
  //     }
  //     else {
  //       newData.push({
  //         event_type: item.event_type,
  //         created_date: item.created_date,
  //         from_account: item.from_account,
  //         to_account: item.to_account,
  //         sale_amount: item.sale_amount,
  //         list_amount: list_amount
  //       });
  //     }
  //   }
    

    
  // }
 
  const getAddress = async(address) => {
    const addy = await useAddressToENS(address);

    //No ens name
    if (isHexString(addy)) {
      const abbrevAddy = abbreviations.address(addy, 2) 
      logger.log(abbrevAddy);

      return abbrevAddy;
    } 
    const abbrevENS = abbreviations.formatAddressForDisplay(addy) 
    logger.log(abbrevENS);

    return abbrevENS;

  };

  const Gradient = styled(RadialGradient).attrs(
    ({ theme: { colors } }) => ({
      center: [0, 0],
      colors:  [colors.whiteLabel, color]
    })
  )`
    position: absolute;
    border-radius: 5;
    width: 10;
    height: 10;
    overflow: hidden;
  `;

  const GradientRow = styled(Row).attrs(({}))`
    height: 10;
    marginBottom: 6;
    marginTop: 4;
  `;

  const InnerColumn = styled(Column).attrs(({}))`
    paddingRight: 24;
  `;

  const DateRow = styled(Row).attrs(({}))`
    marginBottom: 3;
  `;

  const EmptyView = styled(View).attrs(({}))`
    height: 3;
    marginTop: 3.5;
  `;

  const LineView = styled(View).attrs(({}))`
    height: 3;
    backgroundColor: ${color}; 
    opacity: 0.1;
    borderRadius: 1.5;
    position: absolute;
    top: 3.5;
    left: 16;
    right: 6;
  `;



  const renderItem = ({ item, index }) => {

    var isFirst = false;
    var symbol;
    var phrase;
    var suffix;

    if (index == 0) {
      isFirst = true;
    }

    switch (item.event_type) {
      case eventTypes.TRANSFER:
        symbol = eventSymbols.TRANSFER;
        phrase = eventPhrases.TRANSFER;
        var temp = abbreviations.address(item.to_account, 2)
        suffix = `${temp}`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });

      case eventTypes.MINT:
        symbol = eventSymbols.MINT;
        phrase = eventPhrases.MINT;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });

      case eventTypes.SALE:
        symbol = eventSymbols.SALE;
        phrase = eventPhrases.SALE;
        suffix = `${item.sale_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });

      case eventTypes.LIST:
        symbol = eventSymbols.LIST;
        phrase = eventPhrases.LIST;
        suffix = `${item.list_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });

      case eventTypes.DELIST:
        symbol = eventSymbols.DELIST;
        phrase = eventPhrases.DELIST;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });
    }

  }

  const renderHistoryDescription = ({ symbol, phrase, item, suffix, isFirst }) => {
    const date = getHumanReadableDateWithoutOn(new Date(item.created_date).getTime()/1000);

    return (
      <Column>
        <GradientRow> 
          <Gradient color={colors} />
          { isFirst ? <EmptyView /> : <LineView /> }
        </GradientRow>
        
        <InnerColumn>
          <DateRow>
            <Text
              align="left"
              color={color}
              size="smedium"
              weight="heavy"
            >
            {date}     
            </Text>
          </DateRow>
          
          <Row>
            <Text
              align="left"
              color={color}
              size="smedium"
              weight="heavy"
            >
              {symbol}
            </Text>
            <Text
              align="right"
              color={colors.whiteLabel}
              size="smedium"
              weight="heavy"
            >
              {' '}{phrase}{suffix}
            </Text>
          </Row>
        </InnerColumn>
      </Column>
    )
  }
  
  return (
    <View>
      {
        isLoading ?
        <Text style = {{ color: '#FFFFFF'}}> loading </Text>
        :
        <FlatList
          data={tokenHistory}
          renderItem={({item, index}) => renderItem({ item, index })}
          horizontal={true}
          inverted={true}
          showsHorizontalScrollIndicator={false}
        />
      }
    </View>
    
  )
}

export default TokenHistory;

