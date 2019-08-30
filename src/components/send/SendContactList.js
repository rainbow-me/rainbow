import PropTypes from 'prop-types';
import React from 'react';
import { RecyclerListView, LayoutProvider, DataProvider } from 'recyclerlistview';
import { withNavigation } from 'react-navigation';
import { compose } from 'recompact';
import { deviceUtils } from '../../utils';
import { colors } from '../../styles';
import { FlyInAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column } from '../layout';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import SendAvatar from './SendAvatar';

const rowHeight = 62;

const LastRowPadding = 12;

let position = 0;

const COIN_ROW = 1;
const LAST_COIN_ROW = 1;

class SendContactList extends React.Component {
  changeCurrentlyUsedContact = (address) => {
    this.currentlyOpenContact = address;
  }

  closeAllDifferentContacts = (address) => {
    this.touchedContact = address;
    this.recentlyRendered = false;
    this.setState({ touchedContact: address });
  }

  balancesRenderItem = item => (
    <SendAvatar
      onTouch={this.closeAllDifferentContacts}
      onTransitionEnd={this.changeCurrentlyUsedContact}
      onChange={this.props.onUpdateContacts}
      onPress={this.props.onPressContact}
      navigation={this.props.navigation}
      currentlyOpenContact={this.touchedContact}
      {...item}
    />
  );

  constructor(args) {
    super(args);

    this.state = {
      contacts: [],
    };

    this._layoutProvider = new LayoutProvider((i) => {
      if (i === this.state.contacts.length - 1) {
        return LAST_COIN_ROW;
      }
      return COIN_ROW;
    }, (type, dim) => {
      if (type === COIN_ROW) {
        dim.width = deviceUtils.dimensions.width;
        dim.height = rowHeight;
      } else if (type === LAST_COIN_ROW) {
        dim.width = deviceUtils.dimensions.width;
        dim.height = rowHeight + LastRowPadding;
      } else {
        dim.width = 0;
        dim.height = 0;
      }
    });
    this._renderRow = this._renderRow.bind(this);
    this.currentlyOpenContact = undefined;
    this.touchedContact = undefined;
    this.recentlyRendered = false;
  }

  _renderRow(type, data) {
    return this.balancesRenderItem(data);
  }

  componentWillReceiveProps = (props) => {
    let newAssets = Object.assign([], props.allAssets);
    newAssets.reverse();
    newAssets = this.filterContactList(newAssets, props.currentInput, 'nickname');
    if (newAssets !== this.state.contacts) {
      this.setState({ contacts: newAssets });
    }
  }

  filterContactList = (list, searchPhrase, searchParameter = false, separator = ' ') => {
    const filteredList = [];
    if (list && searchPhrase.length > 0) {
      for (let i = 0; i < list.length; i++) {
        const searchedItem = searchParameter ? list[i][searchParameter] : list[i];
        const splitedWordList = searchedItem.split(separator);
        splitedWordList.push(searchedItem);
        splitedWordList.push(removeFirstEmojiFromString(searchedItem).join(''));
        for (let j = 0; j < splitedWordList.length; j++) {
          if (splitedWordList[j].toLowerCase().startsWith(searchPhrase.toLowerCase())) {
            filteredList.push(list[i]);
            break;
          }
        }
      }
    } else {
      return list;
    }
    return filteredList;
  }

  shouldComponentUpdate = () => {
    if (position < 0) {
      return false;
    }
    return true;
  }

  render() {
    return (
      <FlyInAnimation style={{ flex: 1, paddingBottom: sheetVerticalOffset, width: '100%' }}>
        {this.state.contacts.length === 0
          ? <Column
            css={`
              background-color: ${colors.white};
              padding-bottom: ${sheetVerticalOffset + 19};
            `}
            flex={1}
            justify="space-between"
          >
            <Centered flex={1} opacity={0.06}>
              <Icon
                color={colors.blueGreyDark}
                name="send"
                style={{ height: 88, width: 91 }}
              />
            </Centered>
          </Column>
          : <RecyclerListView
            rowRenderer={this._renderRow}
            dataProvider={
              new DataProvider((r1, r2) => {
                if (this.touchedContact && this.currentlyOpenContact && this.touchedContact !== this.currentlyOpenContact && !this.recentlyRendered) {
                  if (r2 === this.state.contacts[this.state.contacts.length - 1]) {
                    this.recentlyRendered = true;
                  }
                  return true;
                } if (r1 !== r2) {
                  return true;
                }
                return false;
              }).cloneWithRows(this.state.contacts)
            }
            layoutProvider={this._layoutProvider}
            onScroll={(event, _offsetX, offsetY) => {
              position = offsetY;
            }}
            optimizeForInsertDeleteAnimations
          />
        }
      </FlyInAnimation>
    );
  }
}

SendContactList.propTypes = {
  allAssets: PropTypes.array,
  currentInput: PropTypes.string,
  navigation: PropTypes.object,
  onPressContact: PropTypes.func,
  onUpdateContacts: PropTypes.array,
};

export default compose(withNavigation)(SendContactList);
