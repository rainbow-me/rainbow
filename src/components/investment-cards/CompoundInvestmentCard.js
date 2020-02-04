import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import { floor } from 'lodash';
import { withProps, withHandlers, compose } from 'recompact';
import { withOpenInvestmentCards, withAccountSettings, withAccountData } from '../../hoc';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import { colors } from '../../styles';
import { graphql } from '@apollo/client';
import { useAccountData, useSavingsAccount } from '../../hooks';
import {
  COMPOUND_DAI_ACCOUNT_TOKEN_QUERY,
  COMPOUND_USDC_ACCOUNT_TOKEN_QUERY,
} from '../../apollo/queries';

import BigNumber from 'bignumber.js';
import AnimateNumber from '@bankify/react-native-animate-number';

/*
  TODO:
   - Convert graphQL HoCs to useSavingsAccount hook
   - Finish animating number for DAI/USDC supply rates
   - Clean  up the component
   - Look into moving enhance up a level so that we can use hooks inside of these functions
*/

const CompoundInvestmentCardHeight = 114;

const AssetLabel = withProps({
  color: 'blueGreyDarkTransparent',
  lineHeight: 'tight',
  size: 'smedium',
})(Text);

const CompoundInvestmentCard = ({
  accountCToken,
  isCollapsible,
  onPress,
  onPressContainer,
  openInvestmentCards,
  ...props
}) => {
  const { nativeCurrency } = useAccountData();
  const savings = useSavingsAccount();

  // const {
  //   cTokenBalance,
  //   lifetimeSupplyInterestAccrued,
  //   market: { exchangeRate, supplyRate },
  // } = accountCToken;

  // console.log('accountCToken', accountCToken);
  // console.log(`props `, props)
  // const interestRate = BigNumber(supplyRate / 2104400).toString();
  // //const val = `${(Number(accountCToken.cTokenBalance) * Number(exchangeRate))}`
  // const val = `$${ (Number(cTokenBalance) * exchangeRate).toFixed(2) } $${ Number(lifetimeSupplyInterestAccrued).toFixed(8) }`
  // console.log('interest rate ', interestRate)

  const balance = 2;
  const interestRate = 3;

  return (
    <InvestmentCard
      {...props}
      containerHeight={CompoundInvestmentCard.height}
      flex={0}
      headerProps={{
        color: colors.limeGreen,
        emoji: 'money_mouth_face',
        value: (
          <AnimateNumber
            value={balance}
            countBy={interestRate}
            timing={(interval = 1, progress) => {
              console.log('progress', progress);
              return interval * (1 - Math.sin(Math.PI * interestRate)) * 10;
            }}
          />
        ),
      }}
      height={CompoundInvestmentCardHeight}
      isExpandedState={!onPress}
    />
  );
};

CompoundInvestmentCard.propTypes = {
  accountCToken: PropTypes.object,
  nativeCurrency: PropTypes.string,
  onPress: PropTypes.func,
  onPressContainer: PropTypes.func,
};

export default CompoundInvestmentCard;
