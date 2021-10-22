import React, { useEffect, useState } from 'react';
import { Column, Row } from '../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList } from "react-native";
import logger from 'logger';
import RadialGradient from 'react-native-radial-gradient';
import { MarkdownText, Text } from '../text';
import { getHumanReadableDate } from '@rainbow-me/helpers/transactions';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings 
 * Scrollable horizonatally
 */

const TokenHistory = ({ 
    contractAndToken,
    color
  }) => {

  // const radialGradientProps = {
  //   center: [0, 1],
  //   colors: color,
  //   pointerEvents: 'none',
  //   style: {
  //     overflow: 'hidden',
  //   },
  // };

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
    return (
      <Column>
        <Column>
          <Row>
            <Text
              align="right"
              color={color}
              lineHeight="loosest"
              size="smedium"
              weight="heavy"
            >
            {date}     | 􀋢 Sold for 1.8 ETH
            </Text>
          </Row>
          <Row>
            <Text
                align="right"
                color={'#FFFFFF'}
                lineHeight="loosest"
                size="smedium"
                weight="heavy"
              >
            {item.event_type}
            </Text>
          </Row>
        </Column>
      </Column>
      

    );
  };
  // const renderItem = ({ item }) => {
  //   switch (item.event_type) {
  //     case "created":
  //       renderCreatedEventType(item);
  //       break;
  //     case "successful":
  //       renderSuccessfulEventType(item);
  //       break;
  //     case "cancelled": 
  //       renderCancelledEventType(item);
  //       break;
  //     case "transfer":
  //       renderTransferEventType(item);
  //       break;
  //     default:
  //       return (
  //         <Column>
  //           <Row>
  //             <Text color={'#FFFFFF'}>{item.event_type}</Text>
  //           </Row>
  //         </Column>
  //       )
  //   }
  // };

  renderCreatedEventType = ({ item }) => {
    logger.log("render created");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>sold on {item.created_date}</Text>
        </Row>
      </Column>
      
    );
  }

  renderSuccessfulEventType = ({ item }) => {
    logger.log("render successful");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>listed on {item.created_date}</Text>
        </Row>
      </Column>
      
    );
  }

  renderCancelledEventType = ({ item }) => {
    logger.log("render cancelled");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>delisted on {item.created_date}</Text>
        </Row>
      </Column>
      
    );
  }

  renderTransferEventType = ({ item }) => {
    logger.log("render transfer");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>sent on {item.created_date}</Text>
        </Row>
      </Column>
      
    );
  }

  /**
   *  Minting - " Minted"
   *  Listed - " Listed for ____"
   *  Transfer - " Sent to address"
   *  Sale - " Sold for amount"
   *  List Price Adjustment " Price raised/lowered to amount"
   *  Setting number of decimals based on price using the package
   * */

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

// {
//   isLoading ?
//   <Text color={'#FFFFFF'}>History Loading</Text> 
//   :
   
// }

export default TokenHistory;

