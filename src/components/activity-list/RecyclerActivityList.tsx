import { get } from 'lodash';
import React, { PureComponent } from 'react';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components';
import {
  ContractInteractionCoinRow,
  RequestCoinRow,
  TransactionCoinRow,
} from '../coin-row';
import ListFooter from '../list/ListFooter';
import { ProfileMasthead } from '../profile';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ActivityListEmptyState' was resolved to ... Remove this comment to see the full error message
import ActivityListEmptyState from './ActivityListEmptyState';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ActivityListHeader' was resolved to '/Us... Remove this comment to see the full error message
import ActivityListHeader from './ActivityListHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module './LoadingState' was resolved to '/Users/ni... Remove this comment to see the full error message
import LoadingState from './LoadingState';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { TransactionStatusTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/transactio... Remove this comment to see the full error message
import { buildTransactionUniqueIdentifier } from '@rainbow-me/helpers/transactions';
import {
  deviceUtils,
  isNewValueForPath,
  safeAreaInsetValues,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';

const ViewTypes = {
  COMPONENT_HEADER: 0,
  FOOTER: 1,
  HEADER: 2,
  ROW: 3,
  SWAPPED_ROW: 4,
};

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
  width: 100%;
`;

const hasRowChanged = (r1: any, r2: any) => {
  if (
    r1.hash === '_header' &&
    (isNewValueForPath(r1, r2, 'header.props.accountAddress') ||
      isNewValueForPath(r1, r2, 'header.props.accountName') ||
      isNewValueForPath(r1, r2, 'header.props.accountColor'))
  ) {
    return true;
  }

  const r1Key = r1.hash ? r1.hash : get(r1, 'displayDetails.timestampInMs', '');
  const r2Key = r2.hash ? r2.hash : get(r2, 'displayDetails.timestampInMs', '');

  return (
    r1Key !== r2Key ||
    isNewValueForPath(r1, r2, 'contact') ||
    isNewValueForPath(r1, r2, 'native.symbol') ||
    isNewValueForPath(r1, r2, 'pending')
  );
};

export default class RecyclerActivityList extends PureComponent {
  layoutProvider: any;
  rlv: any;
  constructor(props: any) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
      headersIndices: [],
      swappedIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        if (index === 0) {
          return props.showcase
            ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'SHOWCASE_HEADER' does not exist on type ... Remove this comment to see the full error message
              ViewTypes.SHOWCASE_HEADER
            : ViewTypes.COMPONENT_HEADER;
        }

        // @ts-expect-error ts-migrate(2339) FIXME: Property 'headersIndices' does not exist on type '... Remove this comment to see the full error message
        if (this.state.headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }

        // @ts-expect-error ts-migrate(2339) FIXME: Property 'headersIndices' does not exist on type '... Remove this comment to see the full error message
        if (this.state.headersIndices.includes(index + 1)) {
          return ViewTypes.FOOTER;
        }

        // @ts-expect-error ts-migrate(2339) FIXME: Property 'swappedIndices' does not exist on type '... Remove this comment to see the full error message
        if (this.state.swappedIndices.includes(index)) {
          return ViewTypes.SWAPPED_ROW;
        }

        return ViewTypes.ROW;
      },
      (type, dim) => {
        // This values has been hardcoded for omitting imports' cycle
        dim.width = deviceUtils.dimensions.width;
        if (type === ViewTypes.ROW) {
          dim.height = 70;
        } else if (type === ViewTypes.SWAPPED_ROW) {
          dim.height = 70;
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'SHOWCASE_HEADER' does not exist on type ... Remove this comment to see the full error message
        } else if (type === ViewTypes.SHOWCASE_HEADER) {
          dim.height = 400;
        } else if (type === ViewTypes.FOOTER) {
          dim.height = 19;
        } else if (type === ViewTypes.HEADER) {
          dim.height = 39;
        } else {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'isLoading' does not exist on type 'Reado... Remove this comment to see the full error message
          dim.height = this.props.isLoading
            ? deviceUtils.dimensions.height
            : // @ts-expect-error ts-migrate(2339) FIXME: Property 'addCashAvailable' does not exist on type... Remove this comment to see the full error message
              (this.props.addCashAvailable ? 278 : 203) +
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'isEmpty' does not exist on type 'Readonl... Remove this comment to see the full error message
              (this.props.isEmpty ? 297 : 0);
        }
      }
    );
    this.layoutProvider.shouldRefreshWithAnchoring = false;
  }

  static getDerivedStateFromProps(props: any, state: any) {
    const headersIndices: any = [];
    const swappedIndices: any = [];
    let index = 1;
    const items = props.sections.reduce(
      (ctx: any, section: any) => {
        section.data.forEach((asset: any) => {
          if (asset.status === TransactionStatusTypes.swapped) {
            swappedIndices.push(index);
          }
          index++;
        });
        index = index + 2;
        headersIndices.push(ctx.length);
        return ctx
          .concat([
            {
              hash: section.title,
              title: section.title,
            },
          ])
          .concat(section.data)
          .concat([{ hash: `${section.title}_end` }]); // footer
      },
      [{ hash: '_header', header: props.header }]
    ); // header
    if (items.length > 1) {
      items.pop(); // remove last footer
    }
    return {
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      swappedIndices,
    };
  }

  getStableId = (index: any) => {
    const row = get(this.state, `dataProvider._data[${index}]`);
    return buildTransactionUniqueIdentifier(row);
  };

  handleListRef = (ref: any) => {
    this.rlv = ref;
  };

  rowRenderer = (type: any, data: any) => {
    if (type === ViewTypes.COMPONENT_HEADER) {
      const header = (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ProfileMasthead
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'addCashAvailable' does not exist on type... Remove this comment to see the full error message
          addCashAvailable={this.props.addCashAvailable}
          recyclerListRef={this.rlv}
        />
      );
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isLoading' does not exist on type 'Reado... Remove this comment to see the full error message
      return this.props.isLoading ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <LoadingState>{header}</LoadingState>
      ) : // @ts-expect-error ts-migrate(2339) FIXME: Property 'isEmpty' does not exist on type 'Readonl... Remove this comment to see the full error message
      this.props.isEmpty ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ActivityListEmptyState label="No transactions yet">
          {header}
        </ActivityListEmptyState>
      ) : (
        header
      );
    }
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (type === ViewTypes.HEADER) return <ActivityListHeader {...data} />;
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (type === ViewTypes.FOOTER) return <ListFooter />;

    if (!data) return null;
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (!data.hash) return <RequestCoinRow item={data} />;
    if (!data.symbol && data.dappName)
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <ContractInteractionCoinRow item={data} />;
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <TransactionCoinRow item={data} />;
  };

  render = () => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StickyContainer stickyHeaderIndices={this.state.headersIndices}>
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not
        assignable to type 'Recycler... Remove this comment to see the full
        error message
        <RecyclerListView
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'dataProvider' does not exist on type 'Re... Remove this comment to see the full error message
          dataProvider={this.state.dataProvider}
          layoutProvider={this.layoutProvider}
          ref={this.handleListRef}
          renderAheadOffset={deviceUtils.dimensions.height}
          rowRenderer={this.rowRenderer}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'isEmpty' does not exist on type 'Readonl... Remove this comment to see the full error message
          scrollEnabled={!(this.props.isEmpty || this.props.isLoading)}
          scrollIndicatorInsets={{
            bottom: safeAreaInsetValues.bottom,
          }}
          style={{ minHeight: 1 }}
        />
      </StickyContainer>
    </Wrapper>
  );
}
