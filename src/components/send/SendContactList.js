import { toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withNavigation } from 'react-navigation';
import { compose } from 'recompact';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import { withSelectedInput } from '../../hoc';
import Routes from '../../screens/Routes/routesNames';
import { deviceUtils } from '../../utils';
import { filterList } from '../../utils/search';
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
    removeContact: PropTypes.func,
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

  static getDerivedStateFromProps(props, state) {
    const newAssets = filterList(props.allAssets, props.currentInput, [
      'nickname',
    ]);
    if (newAssets !== state.contacts) {
      return { ...state, contacts: newAssets };
    }
    return state;
  }

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
    this.touchedContact = toLower(address);
    this.recentlyRendered = false;
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

  handleRefocus = () => {
    if (this.props.selectedInputId) {
      this.props.selectedInputId.focus();
    }
  };

  onSelectEdit = accountInfo => {
    const { address, color, navigation, nickname, onChange } = accountInfo;

    navigation.navigate(Routes.MODAL_SCREEN, {
      address,
      asset: {},
      color,
      contact: { address, color, nickname },
      onCloseModal: onChange,
      onRefocusInput: this.handleRefocus,
      type: 'contact',
    });
  };

  renderItem = (type, item) => {
    const { navigation, onPressContact, removeContact } = this.props;
    return (
      <SwipeableContactRow
        navigation={navigation}
        onPress={onPressContact}
        onSelectEdit={this.onSelectEdit}
        onTouch={this.closeAllDifferentContacts}
        ref={component => {
          this.contacts[toLower(item.address)] = component;
        }}
        removeContact={removeContact}
        {...item}
      />
    );
  };

  render = () => (
    <FlyInAnimation>
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
          scrollViewProps={{
            keyboardShouldPersistTaps: 'always',
          }}
          rowRenderer={this.renderItem}
          style={{ minHeight: 1 }}
        />
      )}
    </FlyInAnimation>
  );
}

export default compose(withSelectedInput, withNavigation)(SendContactList);
