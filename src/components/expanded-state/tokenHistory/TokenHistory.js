import React, { useEffect, useState } from 'react';
import { Column, Row } from '../../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList, View } from "react-native";
import logger from 'logger';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../../text';
import styled from 'styled-components';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useTheme } from '../../../context/ThemeContext';
import { useDimensions } from '@rainbow-me/hooks';
import { TokenHistoryLoader } from './TokenHistoryLoader';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';

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

const Gradient = styled(RadialGradient).attrs(
  ({ color, theme: { colors } }) => ({
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

const GradientRow = styled(Row)`
  height: 10;
  margin-bottom: 6;
  margin-top: 4;
`;

const OuterColumn = styled(Column)`
  'justyify-content: flex-start'
`;

const InnerColumn = styled(Column)`
  padding-right: 24;
`;

const DateRow = styled(Row)`
  margin-bottom: 3;
`;

const EmptyView = styled(View)`
  height: 3;
  marginTop: 3.5;
`;

const LeftSpacer = styled(View)`
  width: 24;
`;

const RightSpacer = styled(View)`
  width: 50;
`;

const LineView = styled(View)`
  height: 3;
  background-color: ${({ color }) => color};
  opacity: 0.1;
  border-radius: 1.5;
  position: absolute;
  top: 3.5;
  left: 16;
  right: 6;
`;

const Container = styled(View).attrs(({}))`
  justify-content: flex-start;
`;

const TokenHistory = ({ 
    contractAndToken,
    color
  }) => {

  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryShort, setTokenHistoryShort] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [tokenID, setTokenID] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const { width } = useDimensions();

  useEffect(async() => {
    const tokenInfoArray = contractAndToken.split("/")
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(async() => {
    await apiGetTokenHistory(contractAddress, tokenID)
    .then(results => {
      setTokenHistory(results);
      if (results.length <= 2) {
        setTokenHistoryShort(true);
      }
    })
    .then(() => {
      setIsLoading(false);
    })
  }, [contractAddress, tokenID]);

  const renderItem = ({ item, index }) => {
    logger.log(tokenHistoryShort);
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
        suffix = `${item.to_account}`;
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
      <OuterColumn>
        <GradientRow> 
          <Gradient color={color} />
          { isFirst ? <EmptyView /> : <LineView color={color} /> }
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
      </OuterColumn>
    )
  }
  
  return (
    <Container>
      {
        isLoading ?
        <Text style={{ color: '#FFFFFF'}}> Loading </Text>
        :
        <View> 
          <TokenHistoryEdgeFade />
            <FlatList
              data={tokenHistory}
              renderItem={({item, index}) => renderItem({ item, index })}
              horizontal={true}
              inverted={true}
              ListHeaderComponent={ tokenHistoryShort ? <RightSpacer /> : <View /> }
              ListFooterComponent={ <LeftSpacer /> }
              showsHorizontalScrollIndicator={false}
            />
          <TokenHistoryEdgeFade />
        </View>
      }
    </Container>
  )
}

export default TokenHistory;

