import React from 'react';
import PropTypes from 'prop-types';
import { floor } from 'lodash';
import { withProps, withHandlers, compose } from 'recompact';
import { withOpenInvestmentCards, withAccountSettings, withAccountData } from '../../hoc';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import { colors, padding } from '../../styles';
import { graphql } from '@apollo/react-hoc';
import { COMPOUND_MARKET_QUERY, COMPOUND_DAI_ACCOUNT_TOKEN_QUERY } from '../../apollo/queries';
import Divider from '../Divider';

const CompoundInvestmentCardHeight =  114;

const AssetLabel = withProps({
  color: 'blueGreyDarkTransparent',
  lineHeight: 'tight',
  size: 'smedium',
})(Text);

const enhance = compose(
    withAccountSettings,
    withAccountData,
    graphql(COMPOUND_MARKET_QUERY, {
      props: ({ data }) => {
        return data
      }
    }),
    graphql(COMPOUND_DAI_ACCOUNT_TOKEN_QUERY, {
        options: (props) => ({
          variables: {
            address: props.accountAddress ? `0xf5dce57282a584d2746faf1593d3121fcac444dc-${props.accountAddress}` : "0xf5dce57282a584d2746faf1593d3121fcac444dc-0x00000000af5a61acaf76190794e3fdf1289288a1"
          },  
        }),
        props: ({ data }) => {
          return data
        }
    }),
    withHandlers({
        onPressContainer: ({ item, onPress }) => () => {
          if (onPress) {
              onPress(item);
          }
        },
    })
);

const CompoundInvestmentCard = enhance(
({ 
   isCollapsible, 
   markets,
   nativeCurrency, 
   onPress, 
   onPressContainer, 
   openInvestmentCards, 
   ...props 
}) => {
  console.log('props ', props);
  return (
  <InvestmentCard
   {...props}
   flex={0}
   containerHeight={CompoundInvestmentCard.height}
   isExpandedState={!onPress}
   headerProps={{
       color: colors.limeGreen,
       emoji: 'money_mouth_face',
       title: '',
       titleColor: '#D040FF',
       value: markets.length 
              ? markets[1].exchangeRate // Set names for markets and  use those  as  keys instead. We don't have a balance. But this will become cToken balance * exchangeRate for the token with LifetimeSupplyAccrued on the opposite end.
              : 1
   }}
        height={CompoundInvestmentCardHeight}
      >

      </InvestmentCard>
  );
})

export default compose(
  withOpenInvestmentCards,
  withAccountData,
)(CompoundInvestmentCard);