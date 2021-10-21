import React, { useEffect } from 'react';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList } from "react-native";
import logger from 'logger';
// import { getHumanReadableDate } from '@rainbow-me/helpers/transactions';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings 
 * Scrollable horizonatally?
 * Need contract address, token ID to query Opensea with
 * How many events to query?
 */

const TokenHistory = ({ 
    contractAndToken,
    color
  }) => {

  const [tokenHistory, setTokenHistory] = useState([]);
  const [contractAddress, setContractAddress] = useState("");
  const [tokenID, setTokenID] = useState("");

  useEffect(() => {
    const tokenInfoArray = contractAndToken.split("/");
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });


  //Query opensea using the contract address + tokenID
  useEffect(async() => {
    await apiGetTokenHistory(contractAddress, tokenID).then(result => {
      setTokenHistory(result);
    });
  }, [contractAddress, tokenID]);

  const renderItem = ({ item }) => {
    switch (item.event_type) {
      case "created":
        
    }
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>{item.event_type}</Text>
        </Row>
        <Row>
          <Text color={'#FFFFFF'}>{item.created_date}</Text>
        </Row>
        <Row>
          <Text color={'#FFFFFF'}>{item.from_address}</Text>
        </Row> 
      </Column>
      
    );
  };

  renderCreatedEventType = ({ item }) => {
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>item created on {item.created_date} by {item.from_address}</Text>
        </Row>
      </Column>
      
    );
  }

  renderSuccessfulEventType = ({ item }) => {
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>item created on {item.created_date} by {item.from_address}</Text>
        </Row>
      </Column>
      
    );
  }

  render = ({ item }) => {
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>item created on {item.created_date} by {item.from_address}</Text>
        </Row>
      </Column>
      
    );
  }

  // renderTextBasedOnEvent = ({ event_type, item }) => {
  //   if (event_type == "successful") {
      
  //   }
  //   else if (event_type == "created") {

  //   }
  //   else if (event_type == "cancelled") {
      
  //   }
  //   else if (event_type == "transfer") {
      
  //   }
    
  // }

  /**
   *  Minting - " Minted"
   *  Listed - " Listed for ____"
   *  Transfer - " Sent to address"
   *  Sale - " Sold for amount"
   *  List Price Adjustment " Price raised/lowered to amount"
   *  Setting number of decimals based on price using the package
   *  
   * */

  return (
    <Column>
      <Row>
        {
          tokenHistory.length > 0 ? 
          <FlatList
          data={tokenHistory}
          renderItem={renderItem}
          horizontal={true}
          inverted={true}
          showsHorizontalScrollIndicator={false}
        /> : <Text>No History!</Text>
        }
        
      </Row>
    </Column>
  )
}

export default TokenHistory;

