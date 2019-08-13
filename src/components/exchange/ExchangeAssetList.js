import { get } from 'lodash';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { Fragment, Component, PureComponent } from 'react';
import { LayoutAnimation } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  shouldUpdate,
  withHandlers,
} from 'recompact';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from "recyclerlistview";
import styled from 'styled-components/primitives';
import { deviceUtils, isNewValueForPath } from '../../utils';
import { colors } from '../../styles';
import { EmptyAssetList } from '../asset-list';
import { ExchangeCoinRow, CoinRow } from '../coin-row';

const ViewTypes = {
  COIN_ROW: 0,
};

const hasRowChanged = (r1, r2) => isNewValueForPath(r1, r2, 'uniqueId')

export default class ExchangeAssetList extends PureComponent {
  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.object),
    itemsCount: PropTypes.number,
    renderItem: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
    }

    this.layoutProvider = new LayoutProvider((index) => {
      return ViewTypes.COIN_ROW;
    }, (type, dim) => {
      if (type === ViewTypes.COIN_ROW) {
        dim.width = deviceUtils.dimensions.width;
        dim.height = CoinRow.height;
      } else {
        dim.width = 0;
        dim.height = 0;
      }
    })
  }

  componentDidMount = () => {
    this.updateList();
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.props.items !== prevProps.items) {
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

  render = () => {
    const { isEmpty, items, ...props } = this.props;
    const { dataProvider } = this.state;

    console.log('dataProvider', dataProvider);

    return (
      <RecyclerListView
        {...props}
        dataProvider={dataProvider}
        layoutProvider={this.layoutProvider}
        renderAheadOffset={deviceUtils.dimensions.height}
        rowRenderer={this.renderRow}
      />
    );
  };
}
