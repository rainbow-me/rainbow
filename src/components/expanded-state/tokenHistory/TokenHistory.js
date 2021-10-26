import React, { useEffect, useState } from 'react';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList, View } from "react-native";
import logger from 'logger';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../../text';
import  web3Provider from '@rainbow-me/handlers/web3';
import { getHumanReadableDate } from '@rainbow-me/helpers/transactions';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings - Cancelled Listings
 * Scrollable horizonatally
 * 
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
  TRANSFER: `Transferred to `,
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
  

  useEffect(async() => {
    const tokenInfoArray = contractAndToken.split("/");
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(async() => {
    await apiGetTokenHistory(contractAddress, tokenID)
    .then(result => {
      setTokenHistory(result);
      setIsLoading(false);
    });
  }, [contractAddress, tokenID]);

  const renderItem = ({ item }) => {
    switch (item.event_type) {
      case eventTypes.TRANSFER:
        var symbol = eventSymbols.TRANSFER;
        var phrase = eventPhrases.TRANSFER;
        var suffix = `${item.to_account}`;
        return renderHistoryDescription({ symbol, phrase, item, suffix });
      case eventTypes.MINT:
        var mintSymbol = eventSymbols.MINT;
        var mintPhrase = eventPhrases.MINT;
        var mintSuffix = ``;
        return renderHistoryDescription({ symbol: mintSymbol, phrase: mintPhrase, item, suffix: mintSuffix });
      case eventTypes.SALE:
        var saleSymbol = eventSymbols.SALE;
        var salePhrase = eventPhrases.SALE;
        var saleSuffix = `${item.sale_amount} ETH`;
        return renderHistoryDescription({ symbol: saleSymbol, phrase: salePhrase, item, suffix: saleSuffix });
      case eventTypes.LIST:
        var listSymbol = eventSymbols.LIST;
        var listPhrase = eventPhrases.LIST;
        var listSuffix = `${item.list_amount} ETH`;
        return renderHistoryDescription({ symbol: listSymbol, phrase: listPhrase, item, suffix: listSuffix });
      case eventTypes.DELIST:
        var delistSymbol = eventSymbols.DELIST;
        var delistPhrase = eventPhrases.DELIST;
        var delistSuffix = ``;
        return renderHistoryDescription({ symbol: delistSymbol, phrase: delistPhrase, item, suffix: delistSuffix });
    }
  }

  const renderHistoryDescription = ({ symbol, phrase, item, suffix }) => {
    const date = getHumanReadableDate(new Date(item.created_date).getTime()/1000);
    return (
      <ColumnWithMargins
        margin={19}
        paddingHorizontal={15}
      >
        <View styles={{ height: 20, width: 250, borderColor: '#FFFFFF' }} />
        <Row>
          <Text
            align="right"
            color={color}
            lineHeight="loosest"
            size="smedium"
            weight="heavy"
          >
          {date}     
          </Text>
        </Row>
        <Row>
          <Text
              align="right"
              color={color}
              lineHeight="loosest"
              size="smedium"
              weight="heavy"
            >
            {symbol}
          </Text>
          <Text
              align="right"
              color={'#FFFFFF'}
              lineHeight="loosest"
              size="smedium"
              weight="heavy"
            >
            {phrase}{suffix}
          </Text>
        </Row>
      </ColumnWithMargins>
    )
  }

  return (
    <Column>
      <Row>
        <FlatList
            data={tokenHistory}
            renderItem={renderItem}
            horizontal={true}
            inverted={true}
            showsHorizontalScrollIndicator={false}
          />
      </Row>
    </Column>
  )
  }

export default TokenHistory;

