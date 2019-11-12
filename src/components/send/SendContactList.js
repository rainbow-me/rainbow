import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import { withNavigation } from 'react-navigation';
import { compose } from 'recompose';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { withSelectedInput } from '../../hoc';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import { deviceUtils } from '../../utils';
import { FlyInAnimation } from '../animations';
import { SwipeableContactRow } from '../contacts';
import SendEmptyState from './SendEmptyState';

const LastRowPadding = 12;
const rowHeight = 62;

let position = 0;

const COIN_ROW = 1;
const LAST_COIN_ROW = 1;

class SendContactList extends Component {
  static propTypes = {
    allAssets: PropTypes.array,
    currentInput: PropTypes.string,
    navigation: PropTypes.object,
    onPressContact: PropTypes.func,
    onUpdateContacts: PropTypes.func,
    selectedInputId: PropTypes.object,
  };

  constructor(args) {
    super(args);

    this.state = {
      contacts: [],
    };

    this.recentlyRendered = false;
    this.touchedContact = undefined;
    this.contacts = {};

    this._layoutProvider = new LayoutProvider(
      i => {
        if (i === this.state.contacts.length - 1) {
          return LAST_COIN_ROW;
        }
        return COIN_ROW;
      },
      (type, dim) => {
        if (type === COIN_ROW) {
          dim.height = rowHeight;
          dim.width = deviceUtils.dimensions.width;
        } else if (type === LAST_COIN_ROW) {
          dim.height = rowHeight + LastRowPadding;
          dim.width = deviceUtils.dimensions.width;
        } else {
          dim.height = 0;
          dim.width = 0;
        }
      }
    );
  }

  componentWillReceiveProps = props => {
    let newAssets = Object.assign([], props.allAssets);
    newAssets.reverse();
    newAssets = this.filterContactList(
      newAssets,
      props.currentInput,
      'nickname'
    );
    if (newAssets !== this.state.contacts) {
      this.setState({ contacts: newAssets });
    }
  };

  shouldComponentUpdate = () => {
    if (position < 0) {
      return false;
    }
    return true;
  };

  closeAllDifferentContacts = address => {
    if (this.touchedContact && this.contacts[this.touchedContact]) {
      this.contacts[this.touchedContact].close();
    }
    this.touchedContact = address;
    this.recentlyRendered = false;
  };

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

  handleScroll = (event, offsetX, offsetY) => {
    position = offsetY;
  };

  hasRowChanged = (r1, r2) => {
    if (r1 !== r2) {
      return true;
    }
    return false;
  };

  onSelectEdit = accountInfo => {
    const { address, color, navigation, nickname, onChange } = accountInfo;
    const refocusCallback =
      this.props.selectedInputId && this.props.selectedInputId.focus;

    navigation.navigate('OverlayExpandedAssetScreen', {
      address,
      asset: [],
      color,
      contact: { address, color, nickname },
      onCloseModal: onChange,
      onRefocusInput: refocusCallback,
      type: 'contact',
    });
  };

  renderItem = (type, item) => (
    <SwipeableContactRow
      inputRef={this.props.inputRef}
      navigation={this.props.navigation}
      onChange={this.props.onUpdateContacts}
      onPress={this.props.onPressContact}
      onSelectEdit={this.onSelectEdit}
      onTouch={this.closeAllDifferentContacts}
      ref={component => {
        this.contacts[item.address] = component;
      }}
      {...item}
    />
  );

  render = () => (
    <FlyInAnimation
      style={{ flex: 1, paddingBottom: sheetVerticalOffset, width: '100%' }}
    >
      {this.state.contacts.length === 0 ? (
        <SendEmptyState />
      ) : (
        <RecyclerListView
          dataProvider={new DataProvider(this.hasRowChanged).cloneWithRows(
            this.state.contacts
          )}
          layoutProvider={this._layoutProvider}
          onScroll={this.handleScroll}
          optimizeForInsertDeleteAnimations
          rowRenderer={this.renderItem}
        />
      )}
    </FlyInAnimation>
  );
}

export default compose(withSelectedInput, withNavigation)(SendContactList);
