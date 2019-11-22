import React from 'react';
import PropTypes from 'prop-types';
import { floor } from 'lodash';
import { withProps, withHandlers, compose } from 'recompact';
import { withOpenInvestmentCards, withAccountSettings, withAccountData } from '../../hoc';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import { colors, padding } from '../../styles';
import { graphql } from '@apollo/react-hoc';
import { COMPOUND_MARKET_QUERY } from '../../apollo/queries';
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
            const info = data 
            console.log('compound data', info);
            return info
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
   info,
   isCollapsible, 
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
   gradientColors={['#ECF1F5', '#E4E9F0']}
   containerHeight={CompoundInvestmentCard.height}
   isExpandedState={!onPress}
   headerProps={{
       color: colors.dark,
       emoji: 'money_mouth_face',
       title: 'Compound',
       titleColor: '#D040FF',
       value: 20.848271029
   }}
        height={CompoundInvestmentCardHeight}
        reverse
      >
          <Divider 
           disabled={!onPress}
           onPress={onPressContainer}
           scaleTo={0.96}
          />
      </InvestmentCard>
  );
})

export default compose(
  withOpenInvestmentCards,
  withAccountData,
)(CompoundInvestmentCard);