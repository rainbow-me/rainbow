import { addHours, differenceInMinutes } from 'date-fns';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { withNavigation } from 'react-navigation';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { RequestCoinIcon } from '../coin-icon';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const getPercentageOfTimeElapsed = (startDate, endDate) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

// eslint-disable-next-line react/prop-types
const bottomRowRender = ({ dappName }) => <CoinName>{dappName}</CoinName>;

// eslint-disable-next-line react/prop-types
const topRowRender = ({ expirationColor, expiresAt }) => {
  const minutes = differenceInMinutes(expiresAt, Date.now());

  return (
    <Text color={expirationColor} weight="semibold">
      Expires in {minutes || 0}m
    </Text>
  );
};

const RequestCoinRow = ({
  expirationColor,
  expiresAt,
  item,
  onPressOpen,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPressOpen} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={bottomRowRender}
      coinIconRender={RequestCoinIcon}
      expirationColor={expirationColor}
      expiresAt={expiresAt}
      topRowRender={topRowRender}
    >
      <Button
        backgroundColor={colors.primaryBlue}
        containerStyles={`
          border-radius: 18;
          height: 36;
          padding-left: 12;
          padding-right: 12;
        `}
        onPress={onPressOpen}
        size="small"
        textProps={{ size: 'smedium' }}
      >
        Open
      </Button>
    </CoinRow>
  </ButtonPressAnimation>
);

RequestCoinRow.propTypes = {
  expirationColor: PropTypes.string,
  expiresAt: PropTypes.number,
  item: PropTypes.object,
  onPressOpen: PropTypes.func,
};

export default compose(
  withNavigation,
  withProps(({ item: { transactionDisplayDetails: { timestampInMs } } }) => {
    const createdAt = new Date(timestampInMs);
    const expiresAt = addHours(createdAt, 1);
    const percentElapsed = getPercentageOfTimeElapsed(createdAt, expiresAt);

    return {
      createdAt,
      expirationColor: (percentElapsed > 25) ? colors.primaryBlue : colors.orangeMedium,
      expiresAt,
      percentElapsed,
    };
  }),
  withHandlers({
    onPressOpen: ({ item, navigation }) => () => (
      navigation.navigate({
        params: { transactionDetails: item },
        routeName: 'ConfirmRequest',
      })
    ),
  }),
  onlyUpdateForKeys(['expirationColor', 'percentElapsed']),
)(RequestCoinRow);
