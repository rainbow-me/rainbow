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
import { useDimensions, useAccountProfile } from '@rainbow-me/hooks';
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
  marginTop: 4;
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

const Container = styled(View)`
  width: 100%;
`;

const ShortListContainer = styled(View)`
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
  const { colors } = useTheme();
  const { width } = useDimensions();
  const { accountAddress, accountENS } = useAccountProfile();
  const { navigate } = useNavigation();

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
    (address) => {
      navigate(Routes.SHOWCASE_SHEET, {
        address: address,
      });
  });

  //TODO: Memoize This
  const renderItem = ({ item, index }) => {
    let isFirst = false;
    let symbol;
    let phrase;
    let suffix;
    let suffixSymbol = `􀆊`;
    let isClickable = false;
    
    if (index == 0) {
      isFirst = true;
    }

    switch (item?.event_type) {
      case eventTypes.TRANSFER:
        symbol = eventSymbols.TRANSFER;
        phrase = eventPhrases.TRANSFER;
        suffix = `${item.to_account} `;
        if (accountAddress.toLowerCase() != item.to_account_eth_address && accountENS != item.to_account) {
          isClickable = true;
        }
        else {
          isClickable = false;
        }
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.MINT:
        symbol = eventSymbols.MINT;
        phrase = eventPhrases.MINT;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.SALE:
        symbol = eventSymbols.SALE;
        phrase = eventPhrases.SALE;
        suffix = `${item.sale_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.LIST:
        symbol = eventSymbols.LIST;
        phrase = eventPhrases.LIST;
        suffix = `${item.list_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.DELIST:
        symbol = eventSymbols.DELIST;
        phrase = eventPhrases.DELIST;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });
    }
  }

  const renderHistoryDescription = ({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol }) => {
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
                onPress={() => handlePress(item.to_account_eth_address)}
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
                    {' '}{phrase}{suffix}{suffixSymbol}
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
        <ShortListContainer>
          <Row>
            <Column>
              { renderItem({item: tokenHistory[0], index: 0}) }
            </Column>
          </Row>
      </ShortListContainer>
        
      )
    }
    else if (tokenHistory.length == 2) {
      return (
        <ShortListContainer>
          <Row>
            <Column>
              { renderItem({item: tokenHistory[1], index: 1}) }
            </Column>
            <Column>
              { renderItem({item: tokenHistory[0], index: 0}) }
            </Column>
          </Row>
        </ShortListContainer>
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

