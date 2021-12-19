import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import { apiGetNftSemiFungibility, apiGetNftTransactionHistory, processRawEvents } from '@rainbow-me/handlers/opensea-api';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useAccountProfile, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import logger from 'logger';
import { EventTypes } from '../../../utils/tokenHistoryUtils';
import NetworkTypes from '@rainbow-me/networkTypes';

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
  const { colors } = useTheme();
  const { accountAddress } = useAccountProfile();
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();

  const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;

  useEffect(() => {
    const tokenInfoArray = contractAndToken.split('/');
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(() => {
    async function fetch() {
      const semiFungible = await apiGetNftSemiFungibility(
        networkPrefix,
        contractAddress,
        tokenID
      );
      const rawEvents = await apiGetNftTransactionHistory(
        networkPrefix,
        semiFungible,
        accountAddress,
        contractAddress,
        tokenID
      );
      const txHistory = await processRawEvents(contractAddress, rawEvents);
      setTokenHistory(txHistory);
      if (txHistory.length <= 2) {
        setTokenHistoryShort(true);
      }
    }
    fetch();
  }, [accountAddress, contractAddress, networkPrefix, tokenID]);

  const handlePress = useCallback(
    address => {
      navigate(Routes.SHOWCASE_SHEET, {
        address: address,
      });
    },
    [navigate]
  );

  const renderItem = ({ item, index }) => {
    let isFirst = index === 0;
    let suffixIcon = `􀆊`;
    let isClickable = false;
    let label, icon, suffix;

    switch (item?.eventType) {
      case EventTypes.ENS.type:
        label = EventTypes.ENS.label;
        icon = EventTypes.ENS.icon;
        break;

      case EventTypes.MINT.type:
        suffix = `${item.toAccount}`;
        isClickable =
          accountAddress.toLowerCase() !== item.toAccountEthAddress;
        label = EventTypes.MINT.label;
        icon = EventTypes.MINT.icon;
        break;

      case EventTypes.SALE.type:
        suffix = `${item.saleAmount} ${item.paymentToken}`;
        label = EventTypes.SALE.label;
        icon = EventTypes.SALE.icon;
        break;

      case EventTypes.TRANSFER.type:
        suffix = `${item.toAccount}`;
        isClickable =
          accountAddress.toLowerCase() !== item.toAccountEthAddress;
        label = EventTypes.TRANSFER.label;
        icon = EventTypes.TRANSFER.icon;
        break;

      default:
        break;
    }
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
      new Date(item.createdDate).getTime() / 1000
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
            onPress={() => handlePress(item.toAccountEthAddress)}
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
      {tokenHistoryShort ? renderTwoOrLessDataItems() : renderFlatList()}
    </>
  );
};

export default TokenHistory;