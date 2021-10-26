import React, { useEffect, useState } from 'react';
import { Column, Row } from '../../layout';
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
        var mSymbol = eventSymbols.MINT;
        var mPhrase = eventPhrases.MINT;
        var mSuffix = ``;
        return renderHistoryDescription({ symbol: mSymbol, phrase: mPhrase, item, suffix: mSuffix });
      // case eventTypes.SALE:
      //   return renderSuccessfulEventType({ item, date });
      // case eventTypes.LIST:
      //   return renderCreatedEventType({ item, date });
      // case eventTypes.DELIST:
      //   return renderCancelledEventType({ date });
    }
  }

  const renderHistoryDescription = ({ symbol, phrase, item, suffix }) => {
    const date = getHumanReadableDate(new Date(item.created_date).getTime()/1000);
    return (
      <Column>
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
      </Column>
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

