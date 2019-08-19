import { get, property } from 'lodash';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { DataProvider, LayoutProvider, RecyclerListView } from "recyclerlistview";
import styled from 'styled-components/primitives';
import { deviceUtils, isNewValueForPath } from '../../utils';
import { colors } from '../../styles';
import { EmptyAssetList } from '../asset-list';
import { ExchangeCoinRow, CoinRow } from '../coin-row';

const ViewTypes = {
  COIN_ROW: 0,
};

const NOOP = () => undefined;

const layoutItemAnimator = {
  animateDidMount: NOOP,
  animateShift: () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')),
  animateWillMount: NOOP,
  animateWillUnmount: NOOP,
  animateWillUpdate: NOOP,
};

const buildUniqueIdForListData = (items = []) => items.map(property('address')).join('_');

const getLayoutTypeForIndex = () => ViewTypes.COIN_ROW;

const hasRowChanged = (r1, r2) => isNewValueForPath(r1, r2, 'uniqueId');

const setLayoutForType = (type, dim) => {
  if (type === ViewTypes.COIN_ROW) {
    dim.width = deviceUtils.dimensions.width;
    dim.height = CoinRow.height;
  } else {
    dim.width = 0;
    dim.height = 0;
  }
};

export default class ExchangeAssetList extends PureComponent {
  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.object),
    renderItem: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
    }

    this.state.dataProvider._requiresDataChangeHandling = true;

    this.layoutProvider = new LayoutProvider(getLayoutTypeForIndex, setLayoutForType)
  }

  rlvRef = React.createRef()

  componentDidMount = () => {
    this.updateList();
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.props.items.length !== prevProps.items.length) {
      this.rlvRef.current.forceRerender();
      this.updateList();
    }
  }

  updateList = () => {
    this.setState((prevState) => ({
      dataProvider: prevState.dataProvider.cloneWithRows(this.props.items),
    }))
  }

  getStableId = (index) => get(this.state, `dataProvider._data[${index}].uniqueId`)

  renderRow = (type, data) => this.props.renderItem(data)

  render = () => (
    <View backgroundColor={colors.white} flex={1} overflow="hidden">
      <RecyclerListView
        {...this.props}
        dataProvider={this.state.dataProvider}
        layoutProvider={this.layoutProvider}
        itemAnimator={layoutItemAnimator}
        onContentSizeChange={this.onContentSizeChange}
        onViewableItemsChanged={this.onViewableItemsChanged}
        optimizeForInsertDeleteAnimations={true}
        ref={this.rlvRef}
        renderAheadOffset={deviceUtils.dimensions.height}
        rowRenderer={this.renderRow}
        scrollViewProps={{
          directionalLockEnabled: true,
          keyboardDismissMode: 'none',
          keyboardShouldPersistTaps: 'always',
          scrollEventThrottle: 32,
        }}
      />
    </View>
  )
}
