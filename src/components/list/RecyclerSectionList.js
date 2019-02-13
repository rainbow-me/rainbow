/** *
 Use this component inside your React Native Application.
 A scrollable list with different item type
 */
import React, { Component } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import TransactionCoinRow from '../coin-row/TransactionCoinRow';
import ActivityList from '../activity-list/ActivityList';
import ActivityListHeader from '../activity-list/ActivityListHeader';
import ListFooter from './ListFooter';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';

import { colors } from '../../styles';

const ViewTypes = {
  COMPONENT_HEADER: 0,
  FOOTER: 1,
  HEADER: 2,
  ROW: 3,
};

const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
  width: 100%;
`;


export default class RecycleTestComponent extends React.Component {
  constructor(args) {
    super(args);
    const { width } = Dimensions.get('window');
    this.state = {
      dataProvider: new DataProvider((r1, r2) => r1 !== r2),
      headersIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        if (index === 0) {
          return ViewTypes.COMPONENT_HEADER;
        }

        if (this.state.headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }

        if (this.state.headersIndices.includes(index + 1)) {
          return ViewTypes.FOOTER;
        }

        return ViewTypes.ROW;
      },
      (type, dim) => {
        dim.width = width;
        if (type === ViewTypes.ROW) {
          dim.height = 64;
        } else if (type === ViewTypes.FOOTER) {
          dim.height = 27;
        } else if (type === ViewTypes.HEADER) {
          dim.height = 35;
        } else {
          dim.height = 150; //TODO
        }
      },
    );
  }

  static getDerivedStateFromProps(props, state) {
    const headersIndices = []; // header
    const items = props.sections.reduce((prev, curr) => {
      console.log("XXXXX", prev.length)
      headersIndices.push(prev.length);
      return prev
        .concat([{
          title: curr.title,
        }])
        .concat(curr.data)
        .concat([{}]); // footer
    }, [{ t: 1 }]); //header
    headersIndices.pop(); // remove last footer
    return {
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
    };
  }

  rowRenderer = (type, data) => {
    if (type === ViewTypes.COMPONENT_HEADER) {
      const { ListHeaderComponent } = this.props;
      console.log(ListHeaderComponent)
      return ListHeaderComponent;
    }
    if (type === ViewTypes.HEADER) {
      return (
        <ActivityListHeader {...data}/>
      );
    }
    if (type === ViewTypes.FOOTER) {
      return (
        <ListFooter/>
      );
    }
    return (
      <TransactionCoinRow
        item={data}
      />
    );
  }

  render() {
    return (
      <Wrapper>
        <StickyContainer
          stickyHeaderIndices={this.state.headersIndices}
        >
          <RecyclerListView
            layoutProvider={this.layoutProvider}
            dataProvider={this.state.dataProvider}
            rowRenderer={this.rowRenderer}
          />
        </StickyContainer>
      </Wrapper>
    );
  }
}
