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
    if (item != null) {
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
    }
    
  };
  // const renderItem = ({ item }) => {
    // switch (item.event_type) {
    //   case "created":
    //     renderCreatedEventType(item);
    //     break;
    //   case "successful":
    //     renderSuccessfulEventType(item);
    //     break;
    //   case "cancelled": 
    //     renderCancelledEventType(item);
    //     break;
    //   case "transfer":
    //     renderTransferEventType(item);
    //     break;
    //   default:
    //     return (
    //       <Column>
    //         <Row>
    //           <Text color={'#FFFFFF'}>{item.event_type}</Text>
    //         </Row>
    //       </Column>
    //     )
    // }
  // };

  renderCreatedEventType = ({ item }) => {
    logger.log("render created");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>sold on {item.created_date} by {item.from_address}</Text>
        </Row>
      </Column>
      
    );
  }

  renderSuccessfulEventType = ({ item }) => {
    logger.log("render successful");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>listed on {item.created_date} by {item.from_address}</Text>
        </Row>
      </Column>
      
    );
  }

  renderCancelledEventType = ({ item }) => {
    logger.log("render cancelled");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>delisted on {item.created_date} by {item.from_address}</Text>
        </Row>
      </Column>
      
    );
  }

  renderTransferEventType = ({ item }) => {
    logger.log("render transfer");
    return (
      <Column>
        <Row>
          <Text color={'#FFFFFF'}>sent on {item.created_date} by {item.from_address}</Text>
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
   *  
   * */

  return (
    <Column>
      <Row>
      {/* <Text>No History!</Text> */}
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

