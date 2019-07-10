import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withNavigation } from 'react-navigation';
import { View } from 'react-primitives';
import {
  compose,
  withHandlers,
  withProps,
  onlyUpdateForKeys,
} from 'recompact';
import { withOpenFamilyTabs, withFabSendAction } from '../../hoc';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyHeader from './TokenFamilyHeader';
import { FadeInAnimation } from '../animations';

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (item) => {
      navigation.navigate('ExpandedAssetScreen', {
        asset: item,
        type: assetType,
      });
    },
    onPressSend: ({ navigation }) => (asset) => {
      navigation.navigate('SendSheet', { asset });
    },
  }),
);

const UniqueTokenItem = enhanceRenderItem(UniqueTokenRow);

const getHeight = (openFamilyTab) => (
  openFamilyTab
    ? UniqueTokenRow.getHeight(false, false) + 100
    : 100
);

const header = (child) => child;

class TokenFamilyWrap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      opacity: 0,
    };
  }

  shouldComponentUpdate = (prev, next) => {
    const familyId = this.props.item[0][0].rowNumber;
    if (this.props.openFamilyTabs[familyId] !== prev.openFamilyTabs[familyId]
      || this.state.opacity != next.opacity
      || this.props.highlight !== prev.highlight) {
      return true;
    }
    return false;
  }

  componentDidUpdate = () => {
    const familyId = this.props.item[0][0].rowNumber;
    const newOpacity = this.props.openFamilyTabs[familyId] ? 1 : 0;
    if (newOpacity) {
      setTimeout(() => {
        this.setState({ opacity: newOpacity });
      }, 100);
    } else {
      this.setState({ opacity: newOpacity });
    }
  }

  collectiblesRenderItem = item => {
    if (this.props.openFamilyTabs[item.item[0][0].rowNumber]) {
      const tokens = [];
      for (let i = 0; i < item.item.length; i++) {
        tokens.push(
          <UniqueTokenItem
            assetType="unique_token"
            isLastRow={item.isLastRow}
            isFirstRow={item.isFirstRow}
            item={item.item[i]}
          />
        );
      }
      return tokens;
    }
  };

  onHeaderPress = () => {
    this.props.setOpenFamilyTabs({
      index: this.props.item[0][0].rowNumber,
      state: !this.props.openFamilyTabs[this.props.item[0][0].rowNumber],
    });
  };

  render() {
    return (
      <View>
        <TokenFamilyHeader
          familyName={this.props.familyName}
          familyImage={this.props.familyImage}
          childrenAmount={this.props.childrenAmount}
          highlight={this.props.highlight}
          isOpen={this.props.openFamilyTabs[this.props.item[0][0].rowNumber]}
          onHeaderPress={this.onHeaderPress}
        />
        {this.state.opacity == 1 &&
          <FadeInAnimation duration={100}>
            {header(this.collectiblesRenderItem(this.props))}
          </FadeInAnimation>
        }
      </View>
    );
  }
}

TokenFamilyWrap.propTypes = {
  childrenAmount: PropTypes.number,
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  highlight: PropTypes.bool,
  item: PropTypes.object,
  openFamilyTabs: PropTypes.array,
  setOpenFamilyTabs: PropTypes.func,
};

TokenFamilyWrap.getHeight = getHeight;

export default compose(
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
    onPressSend: ({ item, onPressSend }) => () => {
      if (onPressSend) {
        onPressSend(item);
      }
    },
  }),
  withProps(({ item: { uniqueId } }) => ({ uniqueId })),
  withFabSendAction,
  onlyUpdateForKeys([
    'height',
    'style',
    'uniqueId',
    'width',
    'highlight',
  ]),
)(withOpenFamilyTabs(TokenFamilyWrap));
