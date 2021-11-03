import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import TokenHistoryLoader from './TokenHistoryLoader';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useAccountProfile, useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const EventEnum = {
  DELIST: {
    icon: `􀎩`,
    label: `Delisted`,
    type: 'cancelled',
  },
  ENS: {
    icon: `􀈐`,
    label: `Registered`,
    type: 'ens-registration',
  },
  LIST: {
    icon: `􀎧`,
    label: `Listed for `,
    type: 'created',
  },
  MINT: {
    icon: `􀎛`,
    label: `Minted`,
    type: 'mint',
  },
  SALE: {
    icon: `􀋢`,
    label: `Sold for `,
    type: 'successful',
  },
  TRANSFER: {
    icon: `􀈠`,
    label: `Sent to `,
    type: 'transfer',
  },
};

const Gradient = styled(RadialGradient).attrs(
  ({ color, theme: { colors } }) => ({
    center: [0, 0],
    colors: [colors.whiteLabel, color],
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

const EmptyView = styled(View)`
  height: 3;
  margin-top: 4;
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

const AccentText = styled(Text).attrs({
  size: 'smedium',
  weight: 'heavy',
})``;

const TokenHistory = ({ contractAndToken, color }) => {
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryShort, setTokenHistoryShort] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [tokenID, setTokenID] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const { width } = useDimensions();
  const { accountAddress, accountENS } = useAccountProfile();
  const { navigate } = useNavigation();

  useEffect(async () => {
    const tokenInfoArray = contractAndToken.split('/');
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(async () => {
    await apiGetTokenHistory(contractAddress, tokenID)
      .then(results => {
        setTokenHistory(results);
        if (results.length <= 2) {
          setTokenHistoryShort(true);
        }
      })
      .then(() => {
        setIsLoading(false);
      });
  }, [contractAddress, tokenID]);

  const handlePress = useCallback(address => {
    navigate(Routes.SHOWCASE_SHEET, {
      address: address,
    });
  });

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
      case EventEnum.DELIST.type:
        symbol = EventEnum.DELIST.icon;
        phrase = EventEnum.DELIST.label;
        suffix = ``;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          phrase,
          suffix,
          suffixSymbol,
          symbol,
        });

      case EventEnum.ENS.type:
        symbol = EventEnum.ENS.icon;
        phrase = EventEnum.ENS.label;
        suffix = ``;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          phrase,
          suffix,
          suffixSymbol,
          symbol,
        });

      case EventEnum.LIST.type:
        symbol = EventEnum.LIST.icon;
        phrase = EventEnum.LIST.label;
        suffix = `${item.list_amount} ETH`;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          phrase,
          suffix,
          suffixSymbol,
          symbol,
        });

      case EventEnum.MINT.type:
        symbol = EventEnum.MINT.icon;
        phrase = EventEnum.MINT.label;
        suffix = ``;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          phrase,
          suffix,
          suffixSymbol,
          symbol,
        });

      case EventEnum.SALE.type:
        symbol = EventEnum.SALE.icon;
        phrase = EventEnum.SALE.label;
        suffix = `${item.sale_amount} ETH`;
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          phrase,
          suffix,
          suffixSymbol,
          symbol,
        });

      case EventEnum.TRANSFER.type:
        symbol = EventEnum.TRANSFER.icon;
        phrase = EventEnum.TRANSFER.label;
        suffix = `${item.to_account} `;
        if (
          accountAddress.toLowerCase() != item.to_account_eth_address &&
          accountENS != item.to_account
        ) {
          isClickable = true;
        } else {
          isClickable = false;
        }
        return renderHistoryDescription({
          isClickable,
          isFirst,
          item,
          phrase,
          suffix,
          suffixSymbol,
          symbol,
        });
    }
  };

  const renderHistoryDescription = ({
    symbol,
    phrase,
    item,
    suffix,
    isFirst,
    isClickable,
    suffixSymbol,
  }) => {
    const date = getHumanReadableDateWithoutOn(
      new Date(item.created_date).getTime() / 1000
    );

    return (
      <Column>
        <GradientRow>
          <Gradient color={color} />
          {isFirst ? <EmptyView /> : <LineView color={color} />}
        </GradientRow>

        <Column style={{ paddingRight: 24 }}>
          <Row style={{ marginBottom: 3 }}>
            <AccentText color={color}>
              {date}
            </AccentText>
          </Row>

          <ButtonPressAnimation
            hapticType="selection"
            disabled={!isClickable}
            onPress={() => handlePress(item.to_account_eth_address)}
            scaleTo={0.92}
          >
            <Row>
              <AccentText color={color}>
                {symbol}
              </AccentText>

              <AccentText color={colors.whiteLabel}>
                {' '}
                {phrase}
                {suffix}
                {isClickable ? suffixSymbol : ''}
              </AccentText>
                
            </Row>
          </ButtonPressAnimation>
        </Column>
      </Column>
    );
  };

  const renderTwoOrLessDataItems = () => {
    return (
      <View style={{ marginLeft: 24 }}>
        <Row>
          { tokenHistory.length == 2 ? renderItem({ index: 1, item: tokenHistory[1] }) : <View /> }
          {renderItem({ index: 0, item: tokenHistory[0] })}
        </Row>
      </View>
    );
  };

  const renderFlatlist = () => {
    return (
      <View>
        <MaskedView maskElement={<TokenHistoryEdgeFade />}>
          <FlatList
            ListFooterComponent={<View style={{ paddingLeft: 24 }} />}
            data={tokenHistory}
            horizontal
            inverted
            renderItem={({ item, index }) => renderItem({ index, item })}
            showsHorizontalScrollIndicator={false}
          />
        </MaskedView>
      </View>
    );
  };

  return (
    <View>
      {isLoading && <TokenHistoryLoader />}
      {!isLoading &&
        (tokenHistoryShort ? renderTwoOrLessDataItems() : renderFlatlist())}
    </View>
  );
};

export default TokenHistory;
