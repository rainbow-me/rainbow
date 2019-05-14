import { has, get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Dimensions } from 'react-native';
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { buildTransactionUniqueIdentifier } from '../../helpers/transactions';
import { deviceUtils, isNewValueForPath, safeAreaInsetValues } from '../../utils';
import {
  ContractInteractionCoinRow,
  RequestCoinRow,
  TransactionCoinRow,
} from '../coin-row';
import ListFooter from '../list/ListFooter';
import ActivityListHeader from './ActivityListHeader';

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

const hasRowChanged = (r1, r2) => {
  if (r1.hash === '_header' && isNewValueForPath(r1, r2, 'header.props.accountAddress')) {
    return true;
  }

  const r1Key = r1.hash ? r1.hash : get(r1, 'transactionDisplayDetails.timestampInMs', '');
  const r2Key = r2.hash ? r2.hash : get(r2, 'transactionDisplayDetails.timestampInMs', '');

  return (r1Key !== r2Key)
    || isNewValueForPath(r1, r2, 'native.symbol')
    || isNewValueForPath(r1, r2, 'pending');
}

export default class RecyclerActivityList extends PureComponent {
  static propTypes = {
    header: PropTypes.node,
    sections: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.array,
      title: PropTypes.string.isRequired,
    })),
  };

  constructor(args) {
    super(args);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
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
        // This values has been hardcoded for omitting imports' cycle
        dim.width = deviceUtils.dimensions.width;
        if (type === ViewTypes.ROW) {
          dim.height = 64;
        } else if (type === ViewTypes.FOOTER) {
          dim.height = 27;
        } else if (type === ViewTypes.HEADER) {
          dim.height = 35;
        } else {
          dim.height = 216;
        }
      },
    );
  }

  static getDerivedStateFromProps(props, state) {
    const headersIndices = [];
    const items = props.sections.reduce((ctx, section) => {
      headersIndices.push(ctx.length);
      return ctx
        .concat([{
          hash: section.title,
          title: section.title,
        }])
        .concat(section.data)
        .concat([{ hash: `${section.title}_end` }]); // footer
    }, [{ hash: '_header', header: props.header }]); // header
    if (items.length > 1) {
      items.pop(); // remove last footer
    }
    return {
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
    };
  }

  getStableId = (index) => {
    const row = get(this.state, `dataProvider._data[${index}]`);
    return buildTransactionUniqueIdentifier(row);
  };

  rowRenderer = (type, data) => {
    if (type === ViewTypes.COMPONENT_HEADER) {
      return data.header;
    }
    if (type === ViewTypes.HEADER) {
      return <ActivityListHeader {...data} />;
    }
    if (type === ViewTypes.FOOTER) {
      return <ListFooter />;
    }
    if (!data) return null;
    if (!data.hash) return <RequestCoinRow item={data} />;
    if (!data.symbol && data.dappName) return <ContractInteractionCoinRow item={data} />;
    return <TransactionCoinRow item={data} />;
  }

  render = () => (
    <Wrapper>
      <StickyContainer stickyHeaderIndices={this.state.headersIndices}>
        <RecyclerListView
          dataProvider={this.state.dataProvider}
          layoutProvider={this.layoutProvider}
          renderAheadOffset={deviceUtils.dimensions.height}
          rowRenderer={this.rowRenderer}
          scrollIndicatorInsets={{
            bottom: safeAreaInsetValues.bottom,
          }}
        />
      </StickyContainer>
    </Wrapper>
  )
}
