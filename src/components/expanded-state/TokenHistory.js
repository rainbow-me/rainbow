import React, { useEffect, useState } from 'react';
import { Column, Row } from '../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList } from "react-native";
import logger from 'logger';
import { abbreviations } from '../../utils';
import RadialGradient from 'react-native-radial-gradient';
import { MarkdownText, Text } from '../text';
import  web3Provider from '@rainbow-me/handlers/web3';
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

  // const renderItem = ({ item }) => {
  //   const date = getHumanReadableDate(new Date(item.created_date).getTime()/1000);
    
  // };

  const renderItem = ({ item }) => {
    const date = getHumanReadableDate(new Date(item.created_date).getTime()/1000);
      if (item.event_type == "transfer") {
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
      else if (item.event_type == "successful") {
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
      else if (item.event_type == "created") {
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
        
  };

  const renderTransferEventType = ({ item }) => {
    if (item.from_account == "0x0000000000000000000000000000000000000000") {
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
            {date}     |
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
            minted 
            </Text>
          </Row>
        </Column>
      )
    }
    else {
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
            {date}     |
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
    }
    
    
  }

  renderSuccessfulEventType = ({ item, date }) => {
    logger.log("render successful");
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
            {date}     |
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
  }

  renderCancelledEventType = ({ item, date }) => {
    logger.log("render cancelled");
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
            {date}     |
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
  }

  renderCreatedEventType = ({ item, date }) => {
    logger.log("render transfer");
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
            {date}     |
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

