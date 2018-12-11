import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers, onlyUpdateForKeys } from 'recompact';
import { setDisplayName } from 'recompose';
import styled from 'styled-components/primitives';
import { ActivityList } from '../components/activity-list';
import { Header, HeaderButton } from '../components/header';
import Icon from '../components/icons/Icon';
import { Column } from '../components/layout';
import {
  withAccountAddress,
  withAccountTransactions,
  withRequests,
  withTrackingScreen,
} from '../hoc';
import { colors, position } from '../styles';

const CloseButtonIcon = styled(Icon)`
  ${position.maxSize(19)}
`;

const Container = styled(Column)`
  ${position.size('100%')}
  background-color: ${colors.white};
  flex: 1;
`;

const ActivityScreen = ({
  accountAddress,
  fetchingTransactions,
  hasPendingTransaction,
  onPressBack,
  requests,
  transactions,
  transactionsCount,
}) => (
  <Container>
    <Header excludeStatusBarHeight={true} align="end">
      <HeaderButton align="end" onPress={onPressBack}>
        <CloseButtonIcon
          color={colors.brightBlue}
          name="close"
        />
      </HeaderButton>
    </Header>
    {(accountAddress && !fetchingTransactions) && (
      <ActivityList
        accountAddress={accountAddress}
        hasPendingTransaction={hasPendingTransaction}
        requests={requests}
        transactions={transactions}
        transactionsCount={transactionsCount}
      />
    )}
  </Container>
);

ActivityScreen.propTypes = {
  accountAddress: PropTypes.string,
  fetchingTransactions: PropTypes.bool,
  hasPendingTransaction: PropTypes.bool,
  onPressBack: PropTypes.func,
  requests: PropTypes.array,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
};

export default compose(
  setDisplayName('ActivityScreen'),
  withAccountAddress,
  withAccountTransactions,
  withRequests,
  withHandlers({
    onPressBack: ({ navigation }) => () => navigation.goBack(),
  }),
  onlyUpdateForKeys(['hasPendingTransaction', 'requests', 'transactionsCount']),
  withTrackingScreen,
)(ActivityScreen);
