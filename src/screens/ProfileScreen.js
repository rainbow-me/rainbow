import PropTypes from 'prop-types';
import React from 'react';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import Icon from '../components/icons/Icon';
import { ProfileMasthead } from '../components/profile';
import { position } from '../styles';
import { ActivityList } from '../components/activity-list';
import BlurOverlay from '../components/BlurOverlay';

const ProfileScreen = ({
  accountAddress,
  blurOpacity,
  hasPendingTransaction,
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
        />
      )}
      requests={requests}
      transactions={transactions}
      transactionsCount={transactionsCount}
    />
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  blurOpacity: PropTypes.object,
  hasPendingTransaction: PropTypes.bool,
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
