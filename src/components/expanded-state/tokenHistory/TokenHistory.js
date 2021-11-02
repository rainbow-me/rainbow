import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Column, Row } from '../../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList, View, ScrollView, InteractionManager } from "react-native";
import logger from 'logger';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../../text';
import styled from 'styled-components';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useTheme } from '../../../context/ThemeContext';
import { useDimensions } from '@rainbow-me/hooks';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import TokenHistoryLoader from './TokenHistoryLoader';
import MaskedView from '@react-native-community/masked-view';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ButtonPressAnimation } from '../../animations';

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
  width: 100%;
`;

const TwoItemContainer = styled(View).attrs(({}))`
  margin-left: 24;
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
  const [isClickable, setIsClickable] = useState(false);
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

  const handlePress = useCallback(
    () => {
      logger.log("sup m8")
    });

  //TODO: Memoize This
  //Remove the 􀆊 when looking at your own account
  const renderItem = ({ item, index }) => {
    let isFirst = false;
    let symbol;
    let phrase;
    let suffix;
    let isClickable;
    
    if (index == 0) {
      isFirst = true;
    }

    switch (item?.event_type) {
      case eventTypes.TRANSFER:
        symbol = eventSymbols.TRANSFER;
        phrase = eventPhrases.TRANSFER;
        suffix = `${item.to_account} 􀆊`;
        isClickable = true;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable });

      case eventTypes.MINT:
        symbol = eventSymbols.MINT;
        phrase = eventPhrases.MINT;
        suffix = ``;
        isClickable = false;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable });

      case eventTypes.SALE:
        symbol = eventSymbols.SALE;
        phrase = eventPhrases.SALE;
        suffix = `${item.sale_amount} ETH`;
        isClickable = false;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable });

      case eventTypes.LIST:
        symbol = eventSymbols.LIST;
        phrase = eventPhrases.LIST;
        suffix = `${item.list_amount} ETH`;
        isClickable = false;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable });

      case eventTypes.DELIST:
        symbol = eventSymbols.DELIST;
        phrase = eventPhrases.DELIST;
        suffix = ``;
        isClickable = false;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable });
    }
  }

  //Todo: Touchable for transactions
  const renderHistoryDescription = ({ symbol, phrase, item, suffix, isFirst, isClickable }) => {
    const date = getHumanReadableDateWithoutOn(new Date(item.created_date).getTime()/1000);

    return (
      
        <Column>
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


            {
              isClickable ? 
              <ButtonPressAnimation
              hapticType={'selection'}
              onPress={handlePress}
              scaleTo={0.92}
              >
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

              </ButtonPressAnimation>
              : 
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
            }
          </InnerColumn>
        </Column>
    )
  }

  //TODO: Memoize this
  const renderTwoOrLessDataItems = () => {
    if (tokenHistory.length == 1) {
      return (
        <Container>
          <MaskedView
            maskElement={<TokenHistoryEdgeFade />}
          > 
            <ScrollView 
            style={{ marginLeft: 24 }}
            horizontal={true}> 
            { renderItem({item: tokenHistory[0], index: 0}) }
            </ScrollView>
        </MaskedView>
      </Container>
        
      )
    }
    else if (tokenHistory.length == 2) {
      return (
        <TwoItemContainer>
          <Row>
            <Column>
              { renderItem({item: tokenHistory[1], index: 1}) }
            </Column>
            <Column>
              { renderItem({item: tokenHistory[0], index: 0}) }
            </Column>
          </Row>
        </TwoItemContainer>
      )
      
    }
  };

  const renderFlatlist = () => {
    return (
      <Container>
        <MaskedView
          maskElement={<TokenHistoryEdgeFade />}
        > 
          <FlatList
            data={tokenHistory}
            renderItem={({item, index}) => renderItem({ item, index })}
            horizontal={true}
            inverted={true}
            ListFooterComponent={ <LeftSpacer /> }
            showsHorizontalScrollIndicator={false}
          />
        </MaskedView>

      </Container>
    )
  }
  
  return (
    <Container>
      {isLoading && <TokenHistoryLoader />}
      {!isLoading && 
      (
        tokenHistoryShort ?
        renderTwoOrLessDataItems() :
        renderFlatlist()
      )}
    </Container>
  )
}

export default TokenHistory;

