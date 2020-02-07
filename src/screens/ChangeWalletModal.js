import PropTypes from 'prop-types';
import React from 'react';
import { View, StatusBar } from 'react-native';
import { orderBy } from 'lodash';
import { compose, lifecycle, withHandlers, withState } from 'recompact';
import { withNavigation } from 'react-navigation';
import { Modal, LoadingOverlay } from '../components/modal';
import {
  withDataInit,
  withIsWalletImporting,
  withAccountAddress,
} from '../hoc';
import ProfileList from '../components/change-wallet/ProfileList';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';

const headerHeight = 68;
const profileRowHeight = 54;

const ChangeWalletModal = ({
  accountAddress,
  currentProfile,
  isCreatingWallet,
  isInitializationOver,
  onChangeWallet,
  onCloseEditProfileModal,
  onCloseModal,
  onDeleteWallet,
  onPressCreateWallet,
  onPressImportSeedPhrase,
  profiles,
}) => {
  const size = profiles ? profiles.length - 1 : 0;
  let listHeight = profileRowHeight * 2 + profileRowHeight * size;
  if (listHeight > 258) {
    listHeight = 258;
  }
  return (
    <View>
      {isCreatingWallet && <LoadingOverlay title="Creating Wallet..." />}
      <Modal
        fixedToTop
        height={headerHeight + listHeight}
        onCloseModal={onCloseModal}
        style={{ borderRadius: 18 }}
      >
        <ProfileList
          currentProfile={currentProfile}
          accountAddress={accountAddress}
          allAssets={profiles}
          height={listHeight}
          onChangeWallet={onChangeWallet}
          onCloseEditProfileModal={onCloseEditProfileModal}
          onDeleteWallet={onDeleteWallet}
          onPressCreateWallet={onPressCreateWallet}
          onPressImportSeedPhrase={onPressImportSeedPhrase}
          isInitializationOver={isInitializationOver}
        />
      </Modal>
    </View>
  );
};

ChangeWalletModal.propTypes = {
  accountAddress: PropTypes.string,
  currentProfile: PropTypes.object,
  isCreatingWallet: PropTypes.bool,
  isInitializationOver: PropTypes.bool,
  onChangeWallet: PropTypes.func,
  onCloseEditProfileModal: PropTypes.func,
  onCloseModal: PropTypes.func,
  onDeleteWallet: PropTypes.func,
  onPressCreateWallet: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
  profiles: PropTypes.array,
};

export default compose(
  withAccountAddress,
  withDataInit,
  withNavigation,
  withIsWalletImporting,
  withState('currentProfile', 'setCurrentProfile', undefined),
  withState('profiles', 'setProfiles', undefined),
  withState('isCreatingWallet', 'setIsCreatingWallet', false),
  withState('isChangingWallet', 'setIsChangingWallet', false),
  withState('isInitializationOver', 'setIsInitializationOver', false),
  withHandlers({
    onChangeWallet: ({
      initializeWalletWithProfile,
      navigation,
      setIsChangingWallet,
    }) => async profile => {
      const setIsLoading = navigation.getParam('setIsLoading', () => null);
      setIsLoading(false);
      await setIsChangingWallet(true);
      await initializeWalletWithProfile(true, false, profile);
      await navigation.goBack();
      // timeout to give time for modal to close
      setTimeout(() => {
        navigation.navigate('WalletScreen');
      }, 400);
      setTimeout(() => {
        StatusBar.setBarStyle('dark-content');
        setIsLoading(true);
      }, 600);
      // // timeout prevent changing avatar during screen transition
    },
    onCloseEditProfileModal: ({
      setCurrentProfile,
      setProfiles,
      accountAddress,
      profiles,
    }) => async editedProfile => {
      let currentProfile = false;
      const newProfiles = profiles;
      let deleteIndex;
      if (newProfiles) {
        for (let i = 0; i < newProfiles.length; i++) {
          if (newProfiles[i].address === editedProfile.address) {
            if (editedProfile.isDeleted) {
              deleteIndex = i;
            } else {
              newProfiles[i] = editedProfile;
            }
          }
          if (newProfiles[i].address.toLowerCase() === accountAddress) {
            currentProfile = newProfiles[i];
          }
        }
      }
      if (editedProfile.isDeleted) {
        newProfiles.splice(deleteIndex, 1);
      }
      setCurrentProfile(currentProfile);
      setProfiles(
        orderBy(
          newProfiles,
          [
            profile => {
              const newEditedProfile = profile.name.toLowerCase();
              editedProfile = removeFirstEmojiFromString(newEditedProfile);
              return editedProfile;
            },
          ],
          ['asc']
        )
      );
    },
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onDeleteWallet: ({ deleteWallet }) => deleteAddress =>
      deleteWallet(deleteAddress),
    onPressCreateWallet: ({
      createNewWallet,
      navigation,
      clearAccountData,
      setIsCreatingWallet,
      uniswapClearState,
      uniqueTokensClearState,
    }) => () => {
      navigation.navigate('ExpandedAssetScreen', {
        actionType: 'Create',
        address: undefined,
        asset: [],
        isCurrentProfile: false,
        isNewProfile: true,
        onCloseModal: isCanceled => {
          if (!isCanceled) {
            const setIsLoading = navigation.getParam(
              'setIsLoading',
              () => null
            );
            setIsCreatingWallet(true);
            setTimeout(async () => {
              await clearAccountData();
              await uniswapClearState();
              await uniqueTokensClearState();
              await createNewWallet();
              navigation.goBack();
              // timeout to give time for modal to close
              setTimeout(() => {
                navigation.navigate('WalletScreen');
              }, 200);
              // timeout prevent changing avatar during screen transition
              setTimeout(() => {
                setIsLoading(true);
              }, 400);
            }, 20);
          }
        },
        profile: {},
        setIsLoading: navigation.getParam('setIsLoading', () => null),
        type: 'profile_creator',
      });
    },
    onPressImportSeedPhrase: ({ navigation }) => () => {
      navigation.goBack();
      navigation.navigate('ImportSeedPhraseSheet');
    },
    setCurrentProfile: ({ setCurrentProfile }) => currentProfile => {
      setCurrentProfile(currentProfile);
    },
    setProfiles: ({ setProfiles }) => profiles => {
      setProfiles(profiles);
    },
  }),
  lifecycle({
    componentDidMount() {
      const profiles = this.props.navigation.getParam('profiles', []);
      this.props.setProfiles(profiles);
      let currentProfile = false;
      if (profiles) {
        for (let i = 0; i < profiles.length; i++) {
          if (profiles[i].address.toLowerCase() === this.props.accountAddress) {
            currentProfile = profiles[i];
          }
        }
      }
      this.props.setCurrentProfile(currentProfile);
      setTimeout(() => {
        this.props.setIsInitializationOver(true);
      }, 130);
    },
  })
)(ChangeWalletModal);
