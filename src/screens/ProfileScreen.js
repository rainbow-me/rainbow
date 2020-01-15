import PropTypes from 'prop-types';
import React from 'react';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { Icon } from '../components/icons';
import { colors, position } from '../styles';
import TransactionList from '../components/transaction-list/TransactionList';

const ProfileScreen = ({
  isEmpty,
  onPressBackButton,
  onPressSettings,
  navigation,
}) => (
  <Page component={FlexItem} style={position.sizeAsObject('100%')}>
    <Header justify="space-between">
      <HeaderButton onPress={onPressSettings}>
        <Icon color={colors.black} name="gear" />
      </HeaderButton>
      <BackButton
        color={colors.black}
        direction="right"
        onPress={onPressBackButton}
      />
    </Header>
    <TransactionList navigation={navigation} style={{ flex: 1 }} />
    {isEmpty && <AddFundsInterstitial />}
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  isEmpty: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  navigation: PropTypes.object,
  onPressBackButton: PropTypes.func,
  onPressSettings: PropTypes.func,
  requests: PropTypes.array,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
};

export default ProfileScreen;
