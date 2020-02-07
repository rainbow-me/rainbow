import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import {
  RecyclerListView,
  LayoutProvider,
  DataProvider,
} from 'recyclerlistview';
import { withNavigation } from 'react-navigation';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { deviceUtils } from '../../utils';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import ProfileRow from './ProfileRow';
import ProfileOption from './ProfileOption';
import ProfileDivider from './ProfileDivider';

const rowHeight = 50;
const lastRowPadding = 10;

let position = 0;

const WALLET_ROW = 1;
const WALLET_LAST_ROW = 2;

const Container = styled.View`
  padding-top: 2px;
`;

class ProfileList extends React.Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssets: PropTypes.array,
    currentProfile: PropTypes.object,
    height: PropTypes.number,
    isInitializationOver: PropTypes.bool,
    navigation: PropTypes.object,
    onChangeWallet: PropTypes.func,
    onCloseEditProfileModal: PropTypes.func,
    onDeleteWallet: PropTypes.func,
    onPressCreateWallet: PropTypes.func,
    onPressImportSeedPhrase: PropTypes.func,
  };

  constructor(args) {
    super(args);

    this.state = {
      profiles: [],
    };

    this._layoutProvider = new LayoutProvider(
      i => {
        if (this.props.allAssets && i < this.props.allAssets.length) {
          return WALLET_ROW;
        }
        return WALLET_LAST_ROW;
      },
      (type, dim) => {
        if (type === WALLET_ROW) {
          dim.width = deviceUtils.dimensions.width;
          dim.height = rowHeight;
        } else if (type === WALLET_LAST_ROW) {
          dim.width = deviceUtils.dimensions.width;
          dim.height = rowHeight + lastRowPadding;
        } else {
          dim.width = 0;
          dim.height = 0;
        }
      }
    );
    this._renderRow = this._renderRow.bind(this);
    this.currentlyOpenProfile = undefined;
    this.touchedContact = undefined;
    this.recentlyRendered = false;
  }

  componentWillReceiveProps = props => {
    if (this.props.isInitializationOver !== props.isInitializationOver) {
      this.isInitalized = true;
    }
    const newAssets = Object.assign([], props.allAssets || []);
    for (let i = 0; i < newAssets.length; i++) {
      if (this.props.accountAddress === newAssets[i].address.toLowerCase()) {
        newAssets.splice(i, 1);
        break;
      }
    }
    newAssets.push({
      icon: 'plus',
      isOption: true,
      label: 'Create a Wallet',
      onPress: this.props.onPressCreateWallet,
    });
    newAssets.push({
      icon: 'arrowBack',
      isOption: true,
      label: 'Import a Wallet',
      onPress: this.props.onPressImportSeedPhrase,
    });

    if (newAssets !== this.state.profiles) {
      this.setState({ profiles: newAssets });
    }
  };

  shouldComponentUpdate = () => {
    if (position < 0) {
      return false;
    }
    return true;
  };

  closeAllDifferentContacts = address => {
    this.lastTouchedContact = this.touchedContact;
    this.touchedContact = address;
    this.recentlyRendered = false;
    this.setState({ touchedContact: address });
  };

  balancesRenderItem = profile =>
    profile.isOption ? (
      <ProfileOption
        icon={profile.icon}
        label={profile.label}
        onPress={profile.onPress}
        isInitializationOver={this.props.isInitializationOver}
      />
    ) : (
      <ProfileRow
        key={profile.address}
        accountName={profile.name}
        accountColor={profile.color}
        accountAddress={profile.address}
        onPress={() => this.props.onChangeWallet(profile)}
        onEditWallet={() =>
          this.props.navigation.navigate('ExpandedAssetScreen', {
            address: profile.address,
            asset: [],
            isCurrentProfile: false,
            onCloseModal: editedProfile => {
              this.props.onCloseEditProfileModal(editedProfile);
              this.props.onDeleteWallet(editedProfile.address);
            },
            profile,
            type: 'profile_creator',
          })
        }
        onTouch={this.closeAllDifferentContacts}
        onTransitionEnd={this.changeCurrentlyUsedContact}
        currentlyOpenProfile={this.touchedContact}
        isInitializationOver={this.props.isInitializationOver}
      />
    );

  _renderRow(type, data) {
    return this.balancesRenderItem(data);
  }

  filterContactList = (
    list,
    searchPhrase,
    searchParameter = false,
    separator = ' '
  ) => {
    const filteredList = [];
    if (list && searchPhrase.length > 0) {
      for (let i = 0; i < list.length; i++) {
        const searchedItem = searchParameter
          ? list[i][searchParameter]
          : list[i];
        const splitedWordList = searchedItem.split(separator);
        splitedWordList.push(searchedItem);
        splitedWordList.push(removeFirstEmojiFromString(searchedItem).join(''));
        for (let j = 0; j < splitedWordList.length; j++) {
          if (
            splitedWordList[j]
              .toLowerCase()
              .startsWith(searchPhrase.toLowerCase())
          ) {
            filteredList.push(list[i]);
            break;
          }
        }
      }
    } else {
      return list;
    }
    return filteredList;
  };

  changeCurrentlyUsedContact = address => {
    this.currentlyOpenProfile = address;
  };

  render() {
    const {
      currentProfile,
      height,
      navigation,
      onCloseEditProfileModal,
      isInitializationOver,
    } = this.props;
    return (
      <Container>
        {currentProfile && (
          <ProfileRow
            accountName={currentProfile.name}
            accountColor={currentProfile.color}
            accountAddress={currentProfile.address}
            isHeader
            onPress={() => navigation.goBack()}
            onEditWallet={() =>
              navigation.navigate('ExpandedAssetScreen', {
                address: currentProfile.address,
                asset: [],
                isCurrentProfile: true,
                onCloseModal: editedProfile =>
                  onCloseEditProfileModal(editedProfile),
                profile: currentProfile,
                type: 'profile_creator',
              })
            }
            onTouch={this.closeAllDifferentContacts}
            onTransitionEnd={this.changeCurrentlyUsedContact}
            isInitializationOver={isInitializationOver}
          />
        )}
        <ProfileDivider />
        <View style={{ height }}>
          <RecyclerListView
            rowRenderer={this._renderRow}
            dataProvider={new DataProvider((r1, r2) => {
              if (this.isInitalized) {
                if (
                  r2 === this.state.profiles[this.state.profiles.length - 2]
                ) {
                  this.isInitalized = false;
                }
                return true;
              }
              if (
                this.touchedContact !== r2.address &&
                this.lastTouchedContact === r2.address &&
                this.currentlyOpenProfile &&
                this.touchedContact !== this.currentlyOpenProfile &&
                !this.recentlyRendered
              ) {
                if (
                  r2 === this.state.profiles[this.state.profiles.length - 2]
                ) {
                  this.recentlyRendered = true;
                }
                return true;
              }
              if (r1 !== r2) {
                return true;
              }
              return false;
            }).cloneWithRows(this.state.profiles)}
            layoutProvider={this._layoutProvider}
            onScroll={(event, _offsetX, offsetY) => {
              position = offsetY;
            }}
            optimizeForInsertDeleteAnimations
          />
        </View>
      </Container>
    );
  }
}

export default compose(withNavigation)(ProfileList);
