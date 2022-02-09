import { Contract } from '@ethersproject/contracts';
import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import TokenHistoryEdgeFade from './TokenHistoryEdgeFade';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import {
  apiGetNftSemiFungibility,
  apiGetNftTransactionHistoryForEventType,
} from '@rainbow-me/handlers/opensea-api';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { formatAssetForDisplay } from '@rainbow-me/helpers';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useAccountProfile, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import NetworkTypes from '@rainbow-me/networkTypes';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  REVERSE_RECORDS_MAINNET_ADDRESS,
  reverseRecordsABI,
} from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import { abbreviations } from '@rainbow-me/utils';
import { EventTypes, PaymentTokens } from '@rainbow-me/utils/tokenHistoryUtils';

const Timeline = styled(View)`
  height: 3;
  background-color: ${({ color }) => color};
  opacity: 0.3;
  border-radius: 1.5;
  position: absolute;
  top: 3.5;
  left: 16;
  right: -13;
`;

const AccentText = styled(Text).attrs({
  size: 'smedium',
  weight: 'heavy',
})``;

const TokenHistory = ({ contract, token, color }) => {
  const [tokenHistory, setTokenHistory] = useState([]);
  const { colors } = useTheme();
  const { accountAddress } = useAccountProfile();
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();

  const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;

  useEffect(() => {
    async function fetchTransactionHistory() {
      const semiFungible = await apiGetNftSemiFungibility(
        networkPrefix,
        contract,
        token
      );

      const [rawTransferEvents, rawSaleEvents] = await Promise.all([
        apiGetNftTransactionHistoryForEventType(
          networkPrefix,
          semiFungible,
          accountAddress,
          contract,
          token,
          EventTypes.TRANSFER.type
        ),
        apiGetNftTransactionHistoryForEventType(
          networkPrefix,
          semiFungible,
          accountAddress,
          contract,
          token,
          EventTypes.SALE.type
        ),
      ]);

      const rawEvents = rawTransferEvents.concat(rawSaleEvents);
      const txHistory = await processRawEvents(contract, rawEvents);

      setTokenHistory(txHistory);
    }
    fetchTransactionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountAddress, contract, networkPrefix, token]);

  const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

  const reverseRecordContract = new Contract(
    REVERSE_RECORDS_MAINNET_ADDRESS,
    reverseRecordsABI,
    web3Provider
  );

  const processRawEvents = async (contractAddress, rawEvents) => {
    rawEvents.sort((event1, event2) =>
      event2.created_date.localeCompare(event1.created_date)
    );
    let addressArray = [];
    let sales = [];
    const events = await rawEvents.map((event, index) => {
      let eventType = event.event_type;
      let createdDate = event.created_date;
      let saleAmount, paymentToken, toAccount, toAccountEthAddress;

      switch (eventType) {
        case EventTypes.TRANSFER.type:
          toAccountEthAddress = event.to_account?.address;
          if (event.from_account?.address === EMPTY_ADDRESS) {
            eventType =
              contractAddress === ENS_NFT_CONTRACT_ADDRESS
                ? EventTypes.ENS.type
                : EventTypes.MINT.type;
          }
          break;

        case EventTypes.SALE.type: {
          sales.push(index);
          paymentToken =
            event.payment_token?.symbol === PaymentTokens.WETH
              ? PaymentTokens.ETH
              : event.payment_token?.symbol;

          const exactSaleAmount = formatAssetForDisplay({
            amount: parseInt(event.total_price).toString(),
            token: paymentToken,
          });

          saleAmount = handleSignificantDecimals(exactSaleAmount, 5);
          break;
        }

        default:
          break;
      }

      if (toAccountEthAddress) {
        addressArray.push(toAccountEthAddress);
      }

      return {
        createdDate,
        eventType,
        paymentToken,
        saleAmount,
        toAccount,
        toAccountEthAddress,
      };
    });

    // swap the order of every sale/transfer tx pair so sale is displayed before transfer
    sales.forEach(saleIndex => {
      if (events.length !== saleIndex + 1) {
        [events[saleIndex], events[saleIndex + 1]] = [
          events[saleIndex + 1],
          events[saleIndex],
        ];
      }
    });

    let ensArray = await reverseRecordContract.getNames(addressArray);

    const ensMap = ensArray.reduce(function (tempMap, ens, index) {
      tempMap[addressArray[index]] = ens;
      return tempMap;
    }, {});

    events.forEach(event => {
      const address = event.toAccountEthAddress;
      if (address) {
        const ens = ensMap[address];
        event.toAccount = ens
          ? abbreviations.abbreviateEnsForDisplay(ens)
          : abbreviations.address(address, 2);
      }
    });

    if (events.length <= 2) {
      events.reverse();
    }

    return events;
  };

  const handlePress = useCallback(
    (address, ens) => {
      navigate(Routes.SHOWCASE_SHEET, {
        address: ens && ens.slice(-4) === '.eth' ? ens : address,
      });
    },
    [navigate]
  );

  const renderItem = ({ item, index }) => {
    let clickableIcon = `􀆊`;
    let isClickable = false;
    let label, icon;

    switch (item?.eventType) {
      case EventTypes.ENS.type:
        label = 'Registered';
        icon = EventTypes.ENS.icon;
        break;

      case EventTypes.MINT.type:
        isClickable = accountAddress.toLowerCase() !== item.toAccountEthAddress;
        label = `Minted by ${item.toAccount}`;
        icon = EventTypes.MINT.icon;
        break;

      case EventTypes.SALE.type:
        label = `Sold for ${item.saleAmount} ${item.paymentToken}`;
        icon = EventTypes.SALE.icon;
        break;

      case EventTypes.TRANSFER.type:
        isClickable = accountAddress.toLowerCase() !== item.toAccountEthAddress;
        label = `Sent to ${item.toAccount}`;
        icon = EventTypes.TRANSFER.icon;
        break;

      default:
        break;
    }
    return renderHistoryDescription({
      clickableIcon,
      icon,
      index,
      isClickable,
      item,
      label,
    });
  };

  const renderHistoryDescription = ({
    icon,
    isClickable,
    index,
    item,
    label,
    clickableIcon,
  }) => {
    let isFirst = index === 0;
    let isLast = index === tokenHistory.length - 1;
    let isShort = tokenHistory.length <= 2;

    const date = getHumanReadableDateWithoutOn(
      new Date(item.createdDate).getTime() / 1000
    );

    return (
      // when the token history isShort, invert the horizontal scroll so the history is pinned to the left instead of right
      <Column
        style={
          (isShort && !isFirst) || (!isShort && !isLast)
            ? { marginLeft: 19 }
            : {}
        }
      >
        {tokenHistory.length > 1 && (
          <Row
            style={{
              height: 10,
              marginBottom: 6,
              marginTop: 4,
            }}
          >
            <View
              style={{
                backgroundColor: color,
                borderRadius: 5,
                height: 10,
                width: 10,
              }}
            />
            {((!isShort && !isFirst) || (isShort && !isLast)) && (
              <Timeline color={color} />
            )}
          </Row>
        )}
        <Column>
          <Row style={{ marginBottom: 3 }}>
            <AccentText color={color}>{date}</AccentText>
          </Row>
          <ButtonPressAnimation
            disabled={!isClickable}
            hapticType="selection"
            onPress={() =>
              handlePress(item.toAccountEthAddress, item.toAccount)
            }
            scaleTo={0.92}
          >
            <Row style={{ marginTop: -3 }}>
              <AccentText color={color} style={{ lineHeight: 20 }}>
                {icon}
              </AccentText>
              <AccentText
                color={colors.whiteLabel}
                style={{ lineHeight: 20, marginLeft: 2 }}
              >
                {label}
                {isClickable && clickableIcon}
              </AccentText>
            </Row>
          </ButtonPressAnimation>
        </Column>
      </Column>
    );
  };

  return (
    <MaskedView
      style={{ marginLeft: -19, marginRight: -19 }}
      maskElement={<TokenHistoryEdgeFade />}
    >
      <FlatList
        contentContainerStyle={{
          paddingLeft: 19,
          paddingRight: 19,
        }}
        data={tokenHistory}
        horizontal
        inverted={tokenHistory.length > 2}
        renderItem={({ item, index }) => renderItem({ index, item })}
        showsHorizontalScrollIndicator={false}
      />
    </MaskedView>
  );
};

export default TokenHistory;
