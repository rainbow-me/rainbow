import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import TokenHistoryLoader from './TokenHistoryLoader';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useAccountProfile, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import logger from 'logger';
import { EventTypes } from '@rainbow-me/utils/tokenHistoryUtils';

const filteredTransactionTypes = new Set([
  EventTypes.ENS.type,
  EventTypes.MINT.type,
  EventTypes.SALE.type,
  EventTypes.TRANSFER.type
]);

const Timeline = styled(View)`
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
  const { accountAddress } = useAccountProfile();
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();

  useEffect(() => {
    const tokenInfoArray = contractAndToken.split('/');
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(() => {
    console.log("hi456");
    async function fetch() {
      const results = await apiGetTokenHistory(
        network,
        contractAddress,
        tokenID,
        accountAddress
      );
      console.log("hi");
      console.log(results);
      console.log("Bye");
      const filteredResults = results.filter((transaction) => {
        console.log(transaction.event_type);
        return filteredTransactionTypes.has(transaction.event_type);
      });
      console.log(filteredResults);
      setTokenHistory(filteredResults);
      if (filteredResults.length <= 2) {
        setTokenHistoryShort(true);
      }
    }
    console.log("hi789");
    setIsLoading(true);
    fetch();
    setIsLoading(false);
  }, [accountAddress, contractAddress, network, tokenID]);

  const handlePress = useCallback(
    address => {
      navigate(Routes.SHOWCASE_SHEET, {
        address: address,
      });
    },
    [navigate]
  );

  const renderItem = ({ item, index }) => {
    console.log("nina");
    let isFirst = index === 0;
    let suffixIcon = `􀆊`;
    let isClickable = false;
    let label, icon, suffix;

    switch (item?.event_type) {
      case EventTypes.ENS.type:
        label = EventTypes.ENS.label;
        icon = EventTypes.ENS.icon;
        break;

      case EventTypes.MINT.type:
        suffix = `${item.to_account}`;
        isClickable =
          accountAddress.toLowerCase() !== item.to_account_eth_address;
        label = EventTypes.MINT.label;
        icon = EventTypes.MINT.icon;
        break;

      case EventTypes.SALE.type:
        suffix = `${item.sale_amount} ${item.payment_token}`;
        label = EventTypes.SALE.label;
        icon = EventTypes.SALE.icon;
        break;

      case EventTypes.TRANSFER.type:
        suffix = `${item.to_account}`;
        isClickable =
          accountAddress.toLowerCase() !== item.to_account_eth_address;
        label = EventTypes.TRANSFER.label;
        icon = EventTypes.TRANSFER.icon;
        break;

      default:
        break;
    }
    console.log(index);
    return renderHistoryDescription({
      icon,
      isClickable,
      isFirst,
      item,
      label,
      suffix,
      suffixIcon,
    });
  };

  const renderHistoryDescription = ({
    icon,
    isClickable,
    isFirst,
    item,
    label,
    suffix,
    suffixIcon,
  }) => {
    const date = getHumanReadableDateWithoutOn(
      new Date(item.created_date).getTime() / 1000
    );

    return (
      <Column>
        <Row style={{height: 10, marginBottom: 6, marginTop: 4}}>
          <View style={{width: 10, height: 10, borderRadius: 10 / 2, backgroundColor: color}} />
          {!isFirst && <Timeline color={color} />}
        </Row>
        <Column style={{ paddingRight: 24 }}>
          <Row style={{ marginBottom: 3 }}>
            <AccentText color={color}>{date}</AccentText>
          </Row>
          <ButtonPressAnimation
            disabled={!isClickable}
            hapticType="selection"
            onPress={() => handlePress(item.to_account_eth_address)}
            scaleTo={0.92}
          >
            <Row>
              <AccentText color={color}>{icon}</AccentText>
              <AccentText color={colors.whiteLabel}>
                {' '}
                {label}
                {suffix}
                {isClickable && suffixIcon}
              </AccentText>
            </Row>
          </ButtonPressAnimation>
        </Column>
      </Column>
    );
  };

  const renderTwoOrLessDataItems = () => {
    return (
      <Row style={{ marginLeft: 24 }}>
        {tokenHistory.length == 2 && renderItem({ index: 1, item: tokenHistory[1] })}
        {renderItem({ index: 0, item: tokenHistory[0] })}
      </Row>
    );
  };

  const renderFlatList = () => {
    console.log("paris");
    return (
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
    );
  };

  return (
    <>
      {isLoading && <TokenHistoryLoader />}
      {!isLoading && (tokenHistoryShort ? renderTwoOrLessDataItems() : renderFlatList())}
    </>
  );
};

export default TokenHistory;