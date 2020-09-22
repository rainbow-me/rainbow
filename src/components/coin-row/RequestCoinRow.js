import { addHours, differenceInMinutes, isPast } from 'date-fns';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch } from 'react-redux';
import {
  dappLogoOverride,
  dappNameOverride,
} from '../../helpers/dappNameHandler';
import { useNavigation } from '../../navigation/Navigation';
import { removeRequest } from '../../redux/requests';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { RequestCoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const BottomRow = ({ dappName, expirationColor }) => (
  <CoinName color={expirationColor} weight="semibold">
    {dappName}
  </CoinName>
);

BottomRow.propTypes = {
  dappName: PropTypes.string,
};

const TopRow = ({ expirationColor, expiresAt }) => {
  const minutes = differenceInMinutes(expiresAt, Date.now());

  return (
    <RowWithMargins margin={2}>
      <Emoji name="clock4" size="tiny" style={{ marginTop: 1.75 }} />
      <Text color={expirationColor} size="smedium" weight="semibold">
        Expires in {minutes || 0}m
      </Text>
    </RowWithMargins>
  );
};

TopRow.propTypes = {
  expirationColor: PropTypes.string,
  expiresAt: PropTypes.number,
};

const RequestCoinRow = ({ item, ...props }) => {
  const buttonRef = useRef();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const handlePressOpen = useCallback(() => {
    navigate(Routes.CONFIRM_REQUEST, {
      transactionDetails: item,
    });
  }, [item, navigate]);

  const [expiresAt, setExpiresAt] = useState(null);
  const [expirationColor, setExpirationColor] = useState(null);
  const [percentElapsed, setPercentElapsed] = useState(null);

  const overrideName = useMemo(() => {
    return dappNameOverride(item?.dappUrl);
  }, [item]);

  const overrideLogo = useMemo(() => {
    return dappLogoOverride(item?.dappUrl);
  }, [item]);

  useEffect(() => {
    if (item?.displayDetails?.timestampInMs) {
      const _createdAt = new Date(item.displayDetails.timestampInMs);
      const _expiresAt = addHours(_createdAt, 1);
      const _percentElapsed = getPercentageOfTimeElapsed(
        _createdAt,
        _expiresAt
      );
      setExpiresAt(_expiresAt);
      setPercentElapsed(_percentElapsed);
      setExpirationColor(
        _percentElapsed > 25 ? colors.appleBlue : colors.orange
      );
    }
  }, [item]);

  const handleExpiredRequests = useCallback(() => {
    if (isPast(expiresAt)) {
      dispatch(removeRequest(item.requestId));
    }
  }, [dispatch, expiresAt, item.requestId]);

  useEffect(() => {
    handleExpiredRequests();
  }, [expiresAt, handleExpiredRequests]);

  const overridenItem = {
    ...item,
    dappName: overrideName || item.dappName,
    imageUrl: overrideLogo || item.imageUrl,
    percentElapsed,
  };

  return (
    <ButtonPressAnimation
      onPress={handlePressOpen}
      scaleTo={0.98}
      waitFor={buttonRef}
    >
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

const getPercentageOfTimeElapsed = (startDate, endDate) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

export default magicMemo(RequestCoinRow);
