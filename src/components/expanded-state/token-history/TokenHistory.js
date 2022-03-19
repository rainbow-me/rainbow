import { Contract } from '@ethersproject/contracts';
import MaskedView from '@react-native-community/masked-view';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { ButtonPressAnimation } from '../../animations';
import EdgeFade from './EdgeFade';
import { useTheme } from '@rainbow-me/context/ThemeContext';
import {
  AccentColorProvider,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  apiGetNftSemiFungibility,
  apiGetNftTransactionHistoryForEventType,
} from '@rainbow-me/handlers/opensea-api';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { formatAssetForDisplay } from '@rainbow-me/helpers';
import { getHumanReadableDate } from '@rainbow-me/helpers/transactions';
import { useAccountProfile, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import NetworkTypes from '@rainbow-me/networkTypes';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  NULL_ETH_ADDRESS,
  REVERSE_RECORDS_MAINNET_ADDRESS,
  reverseRecordsABI,
} from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import { abbreviations } from '@rainbow-me/utils';
import { EventTypes, PaymentTokens } from '@rainbow-me/utils/tokenHistoryUtils';
import logger from 'logger';

const TokenHistory = ({ contractAddress, tokenID, accentColor }) => {
  const [tokenHistory, setTokenHistory] = useState([]);
  const { colors } = useTheme();
  const { accountAddress } = useAccountProfile();
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();

  const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;

  useEffect(() => {
    if (!accountAddress) {
      logger.sentry('NFT transaction history: wallet address not found');
      setTokenHistory(null);
      return;
    }
    const processRawEvents = async (contractAddress, rawEvents) => {
      rawEvents.sort((event1, event2) =>
        event2.created_date?.localeCompare(event1.created_date)
      );
      const addressArray = [];
      const sales = [];
      const events = await rawEvents.map((event, index) => {
        switch (event.event_type) {
          case EventTypes.TRANSFER.type:
            addressArray.push(event.to_account?.address);
            if (event.from_account?.address === NULL_ETH_ADDRESS) {
              event.event_type =
                contractAddress === ENS_NFT_CONTRACT_ADDRESS
                  ? EventTypes.ENS.type
                  : EventTypes.MINT.type;
            }
            break;

          case EventTypes.SALE.type: {
            sales.push(index);
            event.payment_token =
              event.payment_token?.symbol === PaymentTokens.WETH
                ? PaymentTokens.ETH
                : event.payment_token?.symbol;

            const exactSaleAmount = formatAssetForDisplay({
              amount: parseInt(event.total_price).toString(),
              token: event.payment_token,
            });

            event.total_price = handleSignificantDecimals(exactSaleAmount, 5);
            break;
          }

          default:
            break;
        }

        event.created_date = getHumanReadableDate(
          new Date(event.created_date).getTime() / 1000,
          false
        );

        return {
          createdDate: event.created_date,
          eventType: event.event_type,
          paymentToken: event.payment_token,
          recipientAddress: event.to_account?.address,
          recipientDisplay: null,
          saleAmount: event.total_price,
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

      const reverseRecordContract = new Contract(
        REVERSE_RECORDS_MAINNET_ADDRESS,
        reverseRecordsABI,
        web3Provider
      );

      const ensArray = await reverseRecordContract.getNames(addressArray);

      const ensMap = ensArray.reduce((tempMap, ens, index) => {
        tempMap[addressArray[index]] = ens;
        return tempMap;
      }, {});

      events.forEach(event => {
        const address = event.recipientAddress;
        if (address) {
          const ens = ensMap[address];
          event.recipientDisplay = ens
            ? abbreviations.abbreviateEnsForDisplay(ens)
            : abbreviations.address(address, 2);
        }
      });

      return events;
    };

    async function fetchTransactionHistory() {
      try {
        const semiFungible = await apiGetNftSemiFungibility(
          networkPrefix,
          contractAddress,
          tokenID
        );

        const [rawTransferEvents, rawSaleEvents] = await Promise.all([
          apiGetNftTransactionHistoryForEventType(
            networkPrefix,
            semiFungible,
            accountAddress,
            contractAddress,
            tokenID,
            EventTypes.TRANSFER.type
          ),
          apiGetNftTransactionHistoryForEventType(
            networkPrefix,
            semiFungible,
            accountAddress,
            contractAddress,
            tokenID,
            EventTypes.SALE.type
          ),
        ]);

        if (
          (!rawTransferEvents || rawTransferEvents.length === 0) &&
          (!rawSaleEvents || rawSaleEvents.length === 0)
        ) {
          setTokenHistory(null);
          logger.sentry('NFT transaction history: OpenSea returned no data');
          return;
        }

        const rawEvents = rawTransferEvents.concat(rawSaleEvents);
        const txHistory = await processRawEvents(contractAddress, rawEvents);

        setTokenHistory(txHistory);
      } catch {
        logger.sentry('NFT transaction history: OpenSea API error');
        setTokenHistory(null);
        return;
      }
    }
    fetchTransactionHistory();
  }, [accountAddress, contractAddress, networkPrefix, tokenID]);

  const shouldInvertScroll = tokenHistory?.length > 2;

  const handlePress = useCallback(
    (address, ens) => {
      navigate(Routes.SHOWCASE_SHEET, {
        address: ens && ens.slice(-4) === '.eth' ? ens : address,
      });
    },
    [navigate]
  );

  const renderItem = ({ item, index }) => {
    let label, icon;

    switch (item?.eventType) {
      case EventTypes.ENS.type:
        label = 'Registered';
        icon = EventTypes.ENS.icon;
        break;

      case EventTypes.MINT.type:
        label = `Minted by ${item.recipientDisplay}`;
        icon = EventTypes.MINT.icon;
        break;

      case EventTypes.SALE.type:
        label = `Sold for ${Number(
          parseFloat(item.saleAmount).toPrecision(2)
        )} ${item.paymentToken}`;
        icon = EventTypes.SALE.icon;
        break;

      case EventTypes.TRANSFER.type:
        label = `Sent to ${item.recipientDisplay}`;
        icon = EventTypes.TRANSFER.icon;
        break;

      default:
        label = '';
        icon = '';
        break;
    }
    return renderHistoryDescription({
      icon,
      index,
      item,
      label,
    });
  };

  function renderHistoryDescription({ icon, index, item, label }) {
    const shouldRenderTimeline = shouldInvertScroll
      ? index > 0
      : index < tokenHistory.length - 1;

    const shouldRenderPin = tokenHistory.length > 1;

    const isClickable =
      (item.eventType === EventTypes.MINT.type ||
        item.eventType === EventTypes.TRANSFER.type) &&
      accountAddress?.toLowerCase() !== item.recipientAddress;

    return (
      // when the token history isShort, invert the horizontal scroll so the history is pinned to the left instead of right
      <Box>
        <AccentColorProvider color={accentColor}>
          <Stack>
            {shouldRenderTimeline && (
              <Inset left={{ custom: 16 }} right="6px">
                <Box
                  background="accent"
                  borderRadius={1.5}
                  height={{ custom: 3 }}
                  opacity={0.6}
                  position="absolute"
                  top={{ custom: 3.5 }}
                  width="full"
                />
              </Inset>
            )}
            {shouldRenderPin && (
              <Box
                background="accent"
                borderRadius={5}
                height={{ custom: 10 }}
                width={{ custom: 10 }}
              />
            )}
            <Inset top={{ custom: shouldRenderPin ? 8 : 0.5 }}>
              <Text color="accent" size="14px" weight="heavy">
                {item.createdDate}
              </Text>
            </Inset>
            <ButtonPressAnimation
              disabled={!isClickable}
              hapticType="selection"
              onPress={() =>
                handlePress(item.recipientAddress, item.recipientDisplay)
              }
              scaleTo={0.92}
            >
              <Inset right="19px" top="6px">
                <Inline alignVertical="center">
                  <Text color="accent" size="19px">{`${icon}`}</Text>
                  <Text
                    color={{ custom: colors.whiteLabel }}
                    containsEmoji
                    size="14px"
                    weight="heavy"
                  >
                    {` ${label} ${isClickable ? '􀆊' : ''}`}
                  </Text>
                </Inline>
              </Inset>
            </ButtonPressAnimation>
          </Stack>
        </AccentColorProvider>
      </Box>
    );
  }

  return (
    <>
      {tokenHistory ? (
        <MaskedView
          maskElement={<EdgeFade />}
          style={{ marginLeft: -24, marginRight: -24 }}
        >
          <FlatList
            contentContainerStyle={{
              paddingLeft: !shouldInvertScroll ? 24 : undefined,
              paddingRight: shouldInvertScroll ? 24 : undefined,
            }}
            data={
              shouldInvertScroll ? tokenHistory : tokenHistory.slice().reverse()
            }
            horizontal
            inverted={shouldInvertScroll}
            renderItem={({ item, index }) => renderItem({ index, item })}
            showsHorizontalScrollIndicator={false}
          />
        </MaskedView>
      ) : (
        <Text color="secondary50" size="23px" weight="bold">
          Unavailable
        </Text>
      )}
    </>
  );
};

export default TokenHistory;
