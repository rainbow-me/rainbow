import PropTypes from 'prop-types';
import React from 'react';
import { ActivityList } from '../components/activity-list';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import BlurOverlay from '../components/BlurOverlay';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { Icon } from '../components/icons';
import { ProfileMasthead } from '../components/profile';
import { position } from '../styles';

const ProfileScreen = ({
  accountAddress,
  blurOpacity,
  hasPendingTransaction,
  isEmpty,
  nativeCurrency,
  navigation,
  onPressBackButton,
  onPressSettings,
  requests,
  showBlur,
  transactions,
  transactionsCount,
  transitionProps,
}) => (
  <Page component={FlexItem} style={position.sizeAsObject('100%')}>
    {showBlur && (
      <BlurOverlay
        blurType="light"
        opacity={blurOpacity}
      />
    )}
    <Header justify="space-between">
      <HeaderButton onPress={onPressSettings}>
        <Icon name="gear" />
      </HeaderButton>
      <BackButton
        direction="right"
        onPress={onPressBackButton}
      />
    </Header>
    <ActivityList
      accountAddress={accountAddress}
      hasPendingTransaction={hasPendingTransaction}
      header={(
        <ProfileMasthead
          accountAddress={accountAddress}
          navigation={navigation}
          showBottomDivider={!isEmpty}
        />
      )}
      nativeCurrency={nativeCurrency}
      requests={requests}
      transactions={transactions}
      transactionsCount={transactionsCount}
    />
    {isEmpty && <AddFundsInterstitial />}
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  blurOpacity: PropTypes.object,
  hasPendingTransaction: PropTypes.bool,
  isEmpty: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  navigation: PropTypes.object,
  onPressBackButton: PropTypes.func,
  onPressSettings: PropTypes.func,
  requests: PropTypes.array,
  showBlur: PropTypes.bool,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
  transitionProps: PropTypes.object,
};

export default ProfileScreen;
