import PropTypes from 'prop-types';
import React from 'react';
import { ActivityList } from '../components/activity-list';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { FadeInAnimation } from '../components/animations';
import BlurOverlay from '../components/BlurOverlay';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { Icon } from '../components/icons';
import { ProfileMasthead } from '../components/profile';
import { colors, position } from '../styles';

const ProfileScreen = ({
  accountAddress,
  blurOpacity,
  blurTranslateX,
  blurDrawerOpacity,
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
}) => (
  <Page component={FlexItem} style={position.sizeAsObject('100%')}>
    <Header justify="space-between">
      <HeaderButton onPress={onPressSettings}>
        <Icon name="gear"/>
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
    {isEmpty && <AddFundsInterstitial/>}
    <BlurOverlay opacity={blurDrawerOpacity} translateX={blurTranslateX}/>
    {showBlur && (
      <FadeInAnimation duration={200} style={{
        ...position.coverAsObject,
        zIndex: 1,
      }}>
        <BlurOverlay
          backgroundColor={colors.alpha(colors.blueGreyDarker, 0.4)}
          blurType="light"
          opacity={blurOpacity}
        />
      </FadeInAnimation>
    )}
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  blurDrawerOpacity: PropTypes.object,
  blurOpacity: PropTypes.object,
  blurTranslateX: PropTypes.object,
  drawerOpenProgress: PropTypes.object,
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
};

export default ProfileScreen;
