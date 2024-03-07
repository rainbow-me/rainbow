import { addHours, differenceInMinutes, isPast } from 'date-fns';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { RequestCoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { removeRequest } from '@/redux/requests';
import styled from '@/styled-thing';
import { handleWalletConnectRequest } from '@/utils/requestNavigationHandlers';

const getPercentageOfTimeElapsed = (startDate, endDate) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

const ClockEmoji = styled(Emoji).attrs({
  name: 'clock4',
  size: 'tiny',
})({
  marginTop: 1.75,
});

const BottomRow = ({ dappName, expirationColor }) => (
  <CoinName color={expirationColor} weight="semibold">
    {dappName}
  </CoinName>
);

const TopRow = ({ expirationColor, expiresAt }) => {
  const minutes = differenceInMinutes(expiresAt, Date.now());

  return (
    <RowWithMargins margin={2}>
      <ClockEmoji />
      <Text color={expirationColor} size="smedium" weight="semibold">
        {lang.t('exchange.coin_row.expires_in', { minutes: minutes || 0 })}
      </Text>
    </RowWithMargins>
  );
};

const RequestCoinRow = ({ item, ...props }) => {
  const buttonRef = useRef();
  const dispatch = useDispatch();
  const [expiresAt, setExpiresAt] = useState(null);
  const [expirationColor, setExpirationColor] = useState(null);
  const [percentElapsed, setPercentElapsed] = useState(null);
  const { colors } = useTheme();

  useEffect(() => {
    if (item?.displayDetails?.timestampInMs) {
      const _createdAt = new Date(item.displayDetails.timestampInMs);
      const _expiresAt = addHours(_createdAt, 1);
      const _percentElapsed = getPercentageOfTimeElapsed(_createdAt, _expiresAt);
      setExpiresAt(_expiresAt);
      setPercentElapsed(_percentElapsed);
      setExpirationColor(_percentElapsed > 25 ? colors.appleBlue : colors.orange);
    }
  }, [colors, item]);

  const handleExpiredRequests = useCallback(() => {
    if (isPast(expiresAt)) {
      dispatch(removeRequest(item.requestId));
    }
  }, [dispatch, expiresAt, item.requestId]);

  const handlePressOpen = useCallback(() => {
    handleWalletConnectRequest(item);
  }, [item]);

  useEffect(() => {
    handleExpiredRequests();
  }, [expiresAt, handleExpiredRequests]);

  const overridenItem = useMemo(
    () => ({
      ...item,
      dappName: item.dappName,
      imageUrl: item.imageUrl,
      percentElapsed,
    }),
    [item, percentElapsed]
  );

  return (
    <ButtonPressAnimation onPress={handlePressOpen} scaleTo={0.98} waitFor={buttonRef}>
      <CoinRow
        {...props}
        {...overridenItem}
        bottomRowRender={BottomRow}
        coinIconRender={RequestCoinIcon}
        expirationColor={expirationColor}
        expiresAt={expiresAt}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  );
};

export default RequestCoinRow;
