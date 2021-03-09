import { findIndex, get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components';
import { AssetListHeaderHeight } from '../AssetListHeader';
import { ViewTypes } from '../RecyclerViewTypes';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import hasRowChanged from './hasRowChanged';
import { deviceUtils } from '@rainbow-me/utils';

const defaultIndices = [0];

const StyledRecyclerListView = styled(RecyclerListView)`
  background-color: ${({ theme: { colors } }) => colors.white};
  display: flex;
  flex: 1;
  min-height: 1;
`;

export default class RecyclerAssetList extends Component {
  static propTypes = {
    externalScrollView: PropTypes.any,
    hideHeader: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    openFamilyTabs: PropTypes.object,
    openInvestmentCards: PropTypes.object,
    openSavings: PropTypes.bool,
    openSmallBalances: PropTypes.bool,
    paddingBottom: PropTypes.number,
    renderAheadOffset: PropTypes.number,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        balances: PropTypes.bool,
        collectibles: PropTypes.bool,
        data: PropTypes.array.isRequired,
        header: PropTypes.shape({
          title: PropTypes.string,
          totalItems: PropTypes.number,
          totalValue: PropTypes.string,
        }),
        perData: PropTypes.object,
        pools: PropTypes.bool,
        renderItem: PropTypes.func.isRequired,
        type: PropTypes.string,
      })
    ),
  };

  static defaultProps = {
    renderAheadOffset: deviceUtils.dimensions.height,
  };

  constructor(props) {
    super(props);
    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
    };
  }

  static getDerivedStateFromProps(props, state) {
    return props.shouldGetDerivedStateFromProps(props, state);
  }

  componentDidUpdate(prevProps) {
    const { openFamilyTabs, nativeCurrency, sections } = this.props;

    if (nativeCurrency !== prevProps.nativeCurrency) {
      setTimeout(() => {
        RecyclerAssetListSharedState.rlv &&
          RecyclerAssetListSharedState.rlv.scrollToTop(false);
      }, 200);
    }

    let collectibles = {};
    let prevCollectibles = {};

    sections.forEach(section => {
      if (section.collectibles) {
        collectibles = section;
      }
    });

    prevProps.sections.forEach(section => {
      if (section.collectibles) {
        prevCollectibles = section;
      }
    });

    const bottomHorizonOfScreen =
      ((RecyclerAssetListSharedState.rlv &&
        RecyclerAssetListSharedState.rlv.getCurrentScrollOffset()) ||
        0) + RecyclerAssetListSharedState.globalDeviceDimensions;

    // Auto-scroll to opened family logic 👇
    if (openFamilyTabs !== prevProps.openFamilyTabs && collectibles.data) {
      let i = 0;
      while (i < collectibles.data.length) {
        if (
          openFamilyTabs[collectibles.data[i].familyName] === true &&
          !prevProps.openFamilyTabs[collectibles.data[i].familyName]
        ) {
          const safeIndex = i;
          const safeCollectibles = collectibles;
          const familyIndex = findIndex(
            this.state.dataProvider.getAllData(),
            function (data) {
              return (
                data.item?.familyName ===
                safeCollectibles.data[safeIndex].familyName
              );
            }
          );

          const focusedFamilyItem = this.state.dataProvider.getAllData()[
            familyIndex
          ].item;
          const focusedFamilyHeight = ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight(
            {
              amountOfRows: Math.ceil(
                Number(focusedFamilyItem.childrenAmount) / 2
              ),
              isFirst: false,
              isHeader: true,
              isOpen: true,
            }
          );

          const startOfDesiredComponent =
            RecyclerAssetListSharedState.rlv.getLayout(familyIndex).y -
            AssetListHeaderHeight;

          if (
            focusedFamilyHeight <
            RecyclerAssetListSharedState.globalDeviceDimensions
          ) {
            const endOfDesiredComponent =
              startOfDesiredComponent +
              focusedFamilyHeight +
              AssetListHeaderHeight;

            if (endOfDesiredComponent > bottomHorizonOfScreen) {
              this.scrollToOffset(
                endOfDesiredComponent -
                  RecyclerAssetListSharedState.globalDeviceDimensions,
                true
              );
            }
          } else {
            this.scrollToOffset(startOfDesiredComponent, true);
          }

          break;
        }
        i++;
      }
    }

    // Auto-scroll to end of the list if something was closed/disappeared 👇
    if (
      RecyclerAssetListSharedState.rlv &&
      RecyclerAssetListSharedState.rlv.getContentDimension().height <
        bottomHorizonOfScreen +
          ViewTypes.FOOTER.calculateHeight({
            paddingBottom: this.props.paddingBottom || 0,
          }) &&
      RecyclerAssetListSharedState.rlv.getCurrentScrollOffset() > 0 &&
      (!this.props.isCoinListEdited ||
        (!prevProps.isCoinListEdited && this.props.isCoinListEdited))
    ) {
      setTimeout(() => {
        RecyclerAssetListSharedState.rlv &&
          RecyclerAssetListSharedState.rlv.scrollToEnd({ animated: true });
      }, 10);
    }

    // Auto-scroll to showcase family if something was added/removed 👇
    if (
      collectibles.data &&
      prevCollectibles.data &&
      collectibles.data[0]?.familyName === 'Showcase' &&
      (collectibles.data[0]?.childrenAmount !==
        prevCollectibles.data[0]?.childrenAmount ||
        prevCollectibles.data[0]?.familyName !== 'Showcase')
    ) {
      const familyIndex = findIndex(
        this.state.dataProvider.getAllData(),
        function (data) {
          return data.item?.familyName === 'Showcase';
        }
      );

      const startOfDesiredComponent =
        RecyclerAssetListSharedState.rlv.getLayout(familyIndex).y -
        AssetListHeaderHeight;
      this.scrollToOffset(startOfDesiredComponent, true);
    }
  }

  scrollToOffset(position, animated) {
    setTimeout(() => {
      RecyclerAssetListSharedState.rlv &&
        RecyclerAssetListSharedState.rlv.scrollToOffset(0, position, animated);
    }, 5);
  }

  getStableId = index => {
    const { dataProvider } = this.state;
    const row = get(dataProvider.getAllData(), index);

    if (row.item && row.item.familyName) {
      return `family_${row.item.familyName}_${row.item.familyId}`;
    }

    if (row.isHeader && (!row.item || !row.item.familyName)) {
      return `header_${row.title}`;
    }

    if (row.item && row.item.address) {
      return `balance_${row.item.address}`;
    }

    if (row.item && row.item.uniqueId) {
      return `pool_${row.item.uniqueId}`;
    }

    if (row.item && row.item.smallBalancesContainer) {
      return `smallBalancesContainer`;
    }

    if (row.item && row.item.coinDivider) {
      return `coinDivider`;
    }

    if (row.item && row.item.savingsContainer) {
      return `savingsContainer`;
    }

    if (index === dataProvider.getAllData().length - 1) {
      return 'footer';
    }

    return index;
  };

  handleListRef = ref => {
    RecyclerAssetListSharedState.rlv = ref;
  };

  render() {
    const {
      animator,
      externalScrollView,
      renderAheadOffset,
      isCoinListEdited,
      layoutProvider,
      stickyComponentsIndices,
      onScroll,
      scrollViewProps,
      scrollIndicatorInsets,
      extendedState,
    } = this.props;
    const { dataProvider } = this.state;
    return (
      <>
        <StickyContainer
          overrideRowRenderer={this.props.stickyRowRenderer}
          stickyHeaderIndices={
            isCoinListEdited ? defaultIndices : stickyComponentsIndices
          }
        >
          <StyledRecyclerListView
            dataProvider={dataProvider}
            extendedState={extendedState}
            externalScrollView={externalScrollView}
            itemAnimator={animator}
            layoutProvider={layoutProvider}
            onScroll={onScroll}
            ref={this.handleListRef}
            renderAheadOffset={renderAheadOffset}
            rowRenderer={this.props.rowRenderer}
            scrollIndicatorInsets={scrollIndicatorInsets}
            scrollViewProps={scrollViewProps}
          />
        </StickyContainer>
      </>
    );
  }
}
