import { addHours, differenceInMinutes } from 'date-fns';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers, withProps } from 'recompact';
import { withNavigation } from 'react-navigation';
import { css } from 'styled-components/primitives';
import { colors } from '../../styles';
import { Button } from '../buttons';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

import { RequestCoinIcon } from '../coin-icon';

const getPercentageOfTimeElapsed = (startDate, endDate) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

const buttonContainerStyles = css`
  border-radius: 18;
  height: 36;
  padding-left: 12;
  padding-right: 12;
`;

const RequestCoinRow = ({
  expirationColor,
  expiresAt,
  item,
  onPressOpen,
  ...props
}) => (
  <CoinRow
    {...item}
    {...props}
    bottomRowRender={({ dappName }) => <CoinName>{dappName}</CoinName>}
    coinIconRender={RequestCoinIcon}
    expirationColor={expirationColor}
    topRowRender={() => (
      <Text color={expirationColor} weight="semibold">
        Expires in {differenceInMinutes(expiresAt, Date.now())}m
      </Text>
    )}
  >
    <Button
      bgColor={colors.primaryBlue}
      containerStyles={buttonContainerStyles}
      onPress={onPressOpen}
      size="small"
      textProps={{ size: 'smedium' }}
    >
      Open
    </Button>
  </CoinRow>
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
    onPressOpen: ({ item, navigation }) => () =>
      navigation.navigate({
        params: { transactionDetails: item },
        routeName: 'ConfirmRequest',
      }),
  }),
  onlyUpdateForKeys(['expirationColor', 'percentElapsed']),
)(RequestCoinRow);
