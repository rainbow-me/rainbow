import React, { useEffect, useState } from 'react';
import { Column, Row } from '../../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList } from "react-native";
import logger from 'logger';
import { abbreviations } from '../../../utils';
import RadialGradient from 'react-native-radial-gradient';
import { MarkdownText, Text } from '../../text';
import  web3Provider from '@rainbow-me/handlers/web3';
import { getHumanReadableDate } from '@rainbow-me/helpers/transactions';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings - Cancelled Listings
 * Scrollable horizonatally
 */

const TokenHistory = ({ 
    contractAndToken,
    color
  }) => {

  const eventTypes = {
    SALE = 'successful',
    TRANSFER = 'transfer',
    LIST = 'created',
    DELIST = 'cancelled'
  }

  const eventPhrases = {

  }

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
    const date = getHumanReadableDate(new Date(item.created_date).getTime()/1000);
    switch (item.event_type) {
      case eventTypes.TRANSFER:
        return renderTransferEventType({ item, date });
      case eventTypes.SALE:
        return renderSuccessfulEventType({ item, date });
      case eventTypes.LIST:
        return renderCreatedEventType({ item, date });
      case eventTypes.DELIST:
        return renderCancelledEventType({ date });
    }
  }

  const renderHistoryDescription = ({ symbol, phrase, date }) => {
    
  }
  const renderTransferEventType = ({ item, date }) => {
    if (item.from_account == "0x0000000000000000000000000000000000000000") {
      return (
        <Column>
          <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
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
              􀎛
            </Text>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              Minted
            </Text>
          </Row>
          <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
        </Column>
      )
    }
    else {
      return (
        <Column>
        <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
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
              􀈠
            </Text>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              Sent to {abbreviations.address(item.to_account, 2)};
            </Text>
            
          </Row>
          <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
      </Column>
      );
    }
  }

  const renderSuccessfulEventType = ({ item, date }) => {
    return (
      <Column>
        <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
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
              􀋢 
            </Text>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              Sold for {item.sale_amount} ETH
            </Text>
          </Row>
          <Column>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              .     
            </Text>
          </Column>
      </Column>
    )
  }

  const renderCreatedEventType = ({ item, date }) => {
    return (
      <Column>
        <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
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
              􀎧
            </Text>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              Listed for {item.list_amount} ETH
            </Text>
          </Row>
          <Column>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              .     
            </Text>
          </Column>
      </Column>
    )
  }

  const renderCancelledEventType = ({ date }) => {
    return (
      <Column>
        <Column>
            <Text
                  align="right"
                  color={'#FFFFFF'}
                  lineHeight="loosest"
                  size="smedium"
                  weight="heavy"
                >
              .     
            </Text>
          </Column>
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
              􀎩
            </Text>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              Delisted
            </Text>
          </Row>
          <Column>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
              .     
            </Text>
          </Column>
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

