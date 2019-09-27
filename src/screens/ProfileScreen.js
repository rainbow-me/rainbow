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
  blurIntensity,
  isEmpty,
  nativeCurrency,
  navigation,
  onPressBackButton,
  onPressSettings,
  requests,
  transactions,
  transactionsCount,
}) => (
  <Page component={FlexItem} style={position.sizeAsObject('100%')}>
    <Header justify="space-between">
      <HeaderButton onPress={onPressSettings}>
        <Icon name="gear" />
      </HeaderButton>
      <BackButton direction="right" onPress={onPressBackButton} />
    </Header>
    <ActivityList
      accountAddress={accountAddress}
      header={
        <ProfileMasthead
          accountAddress={accountAddress}
          navigation={navigation}
          showBottomDivider={!isEmpty}
        />
      }
      isEmpty={isEmpty}
      nativeCurrency={nativeCurrency}
      requests={requests}
      transactions={transactions}
      transactionsCount={transactionsCount}
    />
    {isEmpty && <AddFundsInterstitial />}
    <BlurOverlay blurType="light" intensity={blurIntensity} />
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  blurIntensity: PropTypes.object,
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
