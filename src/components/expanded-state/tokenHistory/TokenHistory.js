import React, { useEffect, useMemo, useState, useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { Column, ColumnWithMargins, Row } from '../../layout';
import { Text } from '../../text';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList, View, ScrollView, InteractionManager } from "react-native";
import styled from 'styled-components';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useTheme } from '@rainbow-me/context';
import { useDimensions, useAccountProfile } from '@rainbow-me/hooks';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import TokenHistoryLoader from './TokenHistoryLoader';
import MaskedView from '@react-native-community/masked-view';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ButtonPressAnimation } from '../../animations';
import logger from 'logger';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings - Cancelled Listings
 * Scrollable horizonatally
 */
const EventsEnum = {
  DELIST{
    type: 'cancelled'
    label: ,
    icon: ,
  },
  ENS{
    type: 'ens-registration'
    label: ,
    icon: ,
  },
  LIST{
    type: 'created'
    label: ,
    icon: ,
  },
  MINT{
    type: 'mint'
    label: ,
    icon: ,
  },
  SALE{
    type: 'successful'
    label: ,
    icon: ,
  },
  TRANSFER{
    type: 'transfer'
    label: ,
    icon: ,
  },

}
const eventTypes = {
  DELIST: 'cancelled',
  ENS: 'ens-registration',
  LIST: 'created',
  MINT: 'mint',
  SALE: 'successful',
  TRANSFER: 'transfer',
};

const eventPhrases  = {
  DELIST: `Delisted`,
  ENS: `Registered`,
  LIST: `Listed for `,
  MINT:`Minted`,
  SALE: `Sold for `,
  TRANSFER: `Sent to `,
};

const eventIcons = {
  DELIST: `􀎩`,
  ENS: `􀈐`,
  LIST: `􀎧`,
  MINT: `􀎛`,
  SALE: `􀋢`,
  TRANSFER: `􀈠`,
};

const spaceBetweenItems = 24;


const DateRow = styled(Row)`
  margin-bottom: 3;
`;


const LeftSpacer = styled(View)`
  width: ${spaceBetweenItems};
`;


const Container = styled(View)`
  width: 100%;
`;

const ShortListContainer = styled(View)`
  margin-left: ${spaceBetweenItems};
`;

const AccentText = styled(Text).attrs({
  size: 'smedium',
  weight: 'heavy',
})``;

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
        symbol = eventIcons.TRANSFER;
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
        symbol = eventIcons.MINT;
        phrase = eventPhrases.MINT;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.SALE:
        symbol = eventIcons.SALE;
        phrase = eventPhrases.SALE;
        suffix = `${item.sale_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.LIST:
        symbol = eventIcons.LIST;
        phrase = eventPhrases.LIST;
        suffix = `${item.list_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

      case eventTypes.DELIST:
        symbol = eventIcons.DELIST;
        phrase = eventPhrases.DELIST;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });

        case eventTypes.ENS:
          symbol = eventIcons.ENS;
          phrase = eventPhrases.ENS;
          suffix = ``;
          return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol });
    }
  }

  const renderHistoryDescription = ({ symbol, phrase, item, suffix, isFirst, isClickable, suffixSymbol }) => {
    const date = getHumanReadableDateWithoutOn(new Date(item.created_date).getTime()/1000);

    return (
        <ColumnWithMargins margin={6}>
          <TokenHistoryLineDecoration color={color} isFirst={isFirst} />
          <ColumnWithMargins
            margin={3}
            paddingRight={spaceBetweenItems}
          >
            <DateRow>
              <AccentText color={color}>
              {date}     
              </AccentText>
            </DateRow>

              <ButtonPressAnimation
                hapticType={'selection'}
                disabled={!isClickable}
                onPress={() => handlePress(item.to_account_eth_address)}
                scaleTo={0.92}
              >
                <Row>
                  <AccentText color={color}>
                    {symbol}
                  </AccentText>

                  <Text
                    align="right"
                    color={colors.whiteLabel}
                    size="smedium"
                    weight="heavy"
                  >
                    {' '}{phrase}{suffix}{isClickable ? suffixSymbol : ''}
                  </Text>
                </Row>
              </ButtonPressAnimation>
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

