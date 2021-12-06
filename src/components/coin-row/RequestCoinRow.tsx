import { addHours, differenceInMinutes, isPast } from 'date-fns';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { RequestCoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/requests' or... Remove this comment to see the full error message
import { removeRequest } from '@rainbow-me/redux/requests';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const getPercentageOfTimeElapsed = (startDate: any, endDate: any) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

const ClockEmoji = styled(Emoji).attrs({
  name: 'clock4',
  size: 'tiny',
})`
  margin-top: 1.75;
`;

const BottomRow = ({ dappName, expirationColor }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <CoinName color={expirationColor} weight="semibold">
    {dappName}
  </CoinName>
);

const TopRow = ({ expirationColor, expiresAt }: any) => {
  const minutes = differenceInMinutes(expiresAt, Date.now());

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins margin={2}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ClockEmoji />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text color={expirationColor} size="smedium" weight="semibold">
        Expires in {minutes || 0}m
      </Text>
    </RowWithMargins>
  );
};

const RequestCoinRow = ({ item, ...props }: any) => {
  const buttonRef = useRef();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const [expiresAt, setExpiresAt] = useState(null);
  const [expirationColor, setExpirationColor] = useState(null);
  const [percentElapsed, setPercentElapsed] = useState(null);
  const { colors } = useTheme();

  useEffect(() => {
    if (item?.displayDetails?.timestampInMs) {
      const _createdAt = new Date(item.displayDetails.timestampInMs);
      const _expiresAt = addHours(_createdAt, 1);
      const _percentElapsed = getPercentageOfTimeElapsed(
        _createdAt,
        _expiresAt
      );
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Date' is not assignable to param... Remove this comment to see the full error message
      setExpiresAt(_expiresAt);
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
      setPercentElapsed(_percentElapsed);
      setExpirationColor(
        _percentElapsed > 25 ? colors.appleBlue : colors.orange
      );
    }
  }, [colors, item]);

  const handleExpiredRequests = useCallback(() => {
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
    if (isPast(expiresAt)) {
      dispatch(removeRequest(item.requestId));
    }
  }, [dispatch, expiresAt, item.requestId]);

  const handlePressOpen = useCallback(() => {
    navigate(Routes.CONFIRM_REQUEST, {
      transactionDetails: item,
    });
  }, [item, navigate]);

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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      onPress={handlePressOpen}
      scaleTo={0.98}
      waitFor={buttonRef}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
