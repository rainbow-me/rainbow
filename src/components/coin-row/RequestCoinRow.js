import { addHours, differenceInMinutes, subMinutes } from 'date-fns';
import { get } from 'lodash';
import React from 'react';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
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

const RequestCoinRowButton = ({ navigation, transactionDetails }) => (
  <Button
    bgColor={colors.primaryBlue}
    containerStyles={buttonContainerStyles}
    onPress={() => navigation.navigate({
      routeName: 'ConfirmTransaction',
      params: { transactionDetails }
    })}
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
  navigation,
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
    <RequestCoinRowButton navigation={navigation} transactionDetails={item}/>
  </CoinRow>
);

export default compose(
  withNavigation,
  withProps(({ item: { transactionDisplayDetails: { timestampInMs } }}) => {
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
  onlyUpdateForKeys(['expirationColor', 'percentElapsed']),
)(RequestCoinRow);
