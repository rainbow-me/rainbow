import { addHours, differenceInMinutes, subMinutes } from 'date-fns';
import React from 'react';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import { css } from 'styled-components/primitives';
import { colors } from '../../styles';
import { get } from 'lodash';
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

const RequestCoinRowButton = () => (
  <Button
    bgColor={colors.primaryBlue}
    containerStyles={buttonContainerStyles}
    onPress={() => console.log('XXX TODO: HOOK THIS UP')}
    size="small"
    textProps={{ size: 'smedium' }}
  >
    Open
  </Button>
);

const RequestCoinRow = ({
  expirationColor,
  expiresAt,
  item,
  ...props
}) => (
  <CoinRow
    {...item}
    {...props}
    bottomRowRender={({ transactionDisplayDetails }) => <CoinName>{get(transactionDisplayDetails, 'asset.name')}</CoinName>}
    coinIconRender={RequestCoinIcon}
    expirationColor={expirationColor}
    topRowRender={() => (
      <Text color={expirationColor} weight="semibold">
        Expires in {differenceInMinutes(expiresAt, Date.now())}m
      </Text>
    )}
  >
    <RequestCoinRowButton />
  </CoinRow>
);

export default compose(
  withProps(() => {
    // XXX TODO: HOOK THIS UP
    const createdAt = subMinutes(Date.now(), 48);
    // XXX TODO: HOOK THIS UP
    const expiresAt = addHours(createdAt, 1);
    const percentElapsed = getPercentageOfTimeElapsed(createdAt, expiresAt);

    return {
      createdAt,
      expirationColor: (percentElapsed > 25) ? colors.primaryBlue : colors.orangeMedium,
      expiresAt,
      percentElapsed,
    };
  }),
  onlyUpdateForKeys(['expirationColor', 'percentElapsed']),
)(RequestCoinRow);
