import { findIndex, get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import { AssetListHeaderHeight } from '../AssetListHeader';
import { ViewTypes } from '../RecyclerViewTypes';
import LayoutItemAnimator from './LayoutItemAnimator';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import hasRowChanged from './hasRowChanged';
import { deviceUtils, safeAreaInsetValues } from '@rainbow-me/utils';

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
      items: [],
      itemsCount: 0,
      sectionsIndices: [],
      stickyComponentsIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        // Main list logic 👇
        // Every component to render properly should return object
        // containing at least height and index

        // Height should be calculated via calculateHeight func from ViewTypes object

        // Index is type index not some single row index so should describe one kind of object

        const { openFamilyTabs, openInvestmentCards, sections } = this.props;

        const balancesIndex = findIndex(
          sections,
          ({ name }) => name === 'balances'
        );
        const collectiblesIndex = findIndex(
          sections,
          ({ name }) => name === 'collectibles'
        );
        const poolsIndex = findIndex(sections, ({ name }) => name === 'pools');

        const { sectionsIndices } = this.state;
        if (sectionsIndices.includes(index)) {
          if (index === sectionsIndices[poolsIndex]) {
            return {
              height: ViewTypes.POOLS.calculateHeight({
                amountOfRows: sections[poolsIndex].data.length,
                isLast: true,
                isOpen: openInvestmentCards,
              }),
              index: ViewTypes.POOLS.index,
              visibleDuringCoinEdit: ViewTypes.POOLS.visibleDuringCoinEdit,
            };
          }
          return {
            height: ViewTypes.HEADER.calculateHeight({
              hideHeader: this.props.hideHeader,
            }),
            index: ViewTypes.HEADER.index,
            visibleDuringCoinEdit: ViewTypes.HEADER.visibleDuringCoinEdit,
          };
        }

        if (index === this.state.itemsCount - 1) {
          return {
            height: ViewTypes.FOOTER.calculateHeight({
              paddingBottom: this.props.paddingBottom
                ? this.props.paddingBottom
                : 0,
            }),
            index: ViewTypes.FOOTER.index,
          };
        }

        if (
          balancesIndex > -1 &&
          (index <= sectionsIndices[collectiblesIndex] ||
            collectiblesIndex < 0) &&
          (index <= sectionsIndices[poolsIndex] || poolsIndex < 0)
        ) {
          const balanceItemsCount = get(
            sections,
            `[${balancesIndex}].data.length`,
            0
          );
          const lastBalanceIndex =
            sectionsIndices[balancesIndex] + balanceItemsCount;
          if (index === lastBalanceIndex - 2) {
            if (RecyclerAssetListSharedState.coinDividerIndex !== index) {
              RecyclerAssetListSharedState.coinDividerIndex = index;
              if (this.props.isCoinListEdited) {
                this.rlv &&
                  this.props.checkEditStickyHeader(
                    this.rlv.getCurrentScrollOffset()
                  );
              }
            }
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2]
                .smallBalancesContainer
            ) {
              return {
                height: ViewTypes.COIN_DIVIDER.calculateHeight(),
                index: ViewTypes.COIN_DIVIDER.index,
                visibleDuringCoinEdit:
                  ViewTypes.COIN_DIVIDER.visibleDuringCoinEdit,
              };
            }
          }
          if (index === lastBalanceIndex - 1) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2] &&
              sections[balancesIndex].data[lastBalanceIndex - 2]
                .smallBalancesContainer
            ) {
              const smallBalancesIndex = index - 1;
              return {
                height: ViewTypes.COIN_SMALL_BALANCES.calculateHeight({
                  isCoinListEdited: this.props.isCoinListEdited,
                  isOpen: this.props.openSmallBalances,
                  smallBalancesLength:
                    sections[balancesIndex].data[smallBalancesIndex].assets
                      .length,
                }),
                index: ViewTypes.COIN_SMALL_BALANCES.index,
                visibleDuringCoinEdit:
                  ViewTypes.COIN_SMALL_BALANCES.visibleDuringCoinEdit,
              };
            }
          }
          if (index === lastBalanceIndex) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 1]
                .savingsContainer
            ) {
              return {
                height: ViewTypes.COIN_SAVINGS.calculateHeight({
                  amountOfRows:
                    sections[balancesIndex].data[index - 1].assets?.length || 0,
                  isLast: poolsIndex < 0,
                  isOpen: this.props.openSavings,
                }),
                index: ViewTypes.COIN_SAVINGS.index,
              };
            }
            this.lastAssetIndex = index;
          }
          const firstBalanceIndex = sectionsIndices[balancesIndex] + 1;
          const isFirst =
            index === firstBalanceIndex &&
            !sections[balancesIndex].data[firstBalanceIndex - 1]
              .smallBalancesContainer;

          return {
            height: ViewTypes.COIN_ROW.calculateHeight({
              areSmallCollectibles: this.state.areSmallCollectibles,
              isFirst,
              isLast: index === lastBalanceIndex,
            }),
            index: ViewTypes.COIN_ROW.index,
            isFirst,
            visibleDuringCoinEdit: ViewTypes.COIN_ROW.visibleDuringCoinEdit,
          };
        }

        if (collectiblesIndex > -1) {
          if (index > sectionsIndices[collectiblesIndex]) {
            const familyIndex = this.state.items[index].familySectionIndex;
            const isFirst = index === sectionsIndices[collectiblesIndex] + 1;
            const isHeader =
              sections[collectiblesIndex].data[familyIndex].isHeader;
            return {
              height: ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight({
                amountOfRows: get(
                  sections,
                  `[${collectiblesIndex}].data[${familyIndex}].tokens`,
                  []
                ).length,
                isFirst,
                isHeader,
                isOpen:
                  openFamilyTabs[
                    sections[collectiblesIndex].data[familyIndex].familyName
                  ],
              }),
              index: ViewTypes.UNIQUE_TOKEN_ROW.index,
              isFirst,
              isHeader,
            };
          }
        }

        return {
          height: ViewTypes.UNKNOWN.calculateHeight(),
          index: ViewTypes.UNKNOWN.index,
        };
      },
      (type, dim) => {
        // Set height of element using object created above 👇
        dim.width = deviceUtils.dimensions.width;
        if (this.props.isCoinListEdited && !type.visibleDuringCoinEdit) {
          dim.height = 0;
        } else {
          dim.height = type.height;
        }
      }
    );
  }

  static getDerivedStateFromProps({ sections, openFamilyTabs }, state) {
    const sectionsIndices = [];
    const stickyComponentsIndices = [];
    const items = sections.reduce((ctx, section) => {
      sectionsIndices.push(ctx.length);
      if (section.pools) {
        ctx = ctx.concat([
          {
            data: section.data,
            pools: true,
            ...section.header,
          },
        ]);
      } else {
        stickyComponentsIndices.push(ctx.length);
        ctx = ctx.concat([
          {
            isHeader: true,
            ...section.header,
          },
        ]);
        if (section.collectibles) {
          section.data.forEach((item, index) => {
            if (item.isHeader || openFamilyTabs[item.familyName]) {
              ctx.push({
                familySectionIndex: index,
                item: { ...item, ...section.perData },
                renderItem: section.renderItem, // 8% of CPU
              });
            }
          });
        } else {
          ctx = ctx.concat(
            section.data.map(item => ({
              item: { ...item, ...section.perData },
              renderItem: section.renderItem, // 1% of CPU
            }))
          );
        }
      }
      return ctx;
    }, []);
    items.push({ item: { isLastPlaceholder: true }, renderItem: () => null });
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(
      sections.find(e => e.collectibles)
    );
    return {
      areSmallCollectibles,
      dataProvider: state.dataProvider.cloneWithRows(items),
      items,
      itemsCount: items.length,
      sectionsIndices,
      stickyComponentsIndices,
    };
  }

  componentDidMount() {
    this.animator = new LayoutItemAnimator(this.rlv, this.props.paddingBottom);
  }

  componentDidUpdate(prevProps) {
    const { openFamilyTabs, nativeCurrency, sections } = this.props;

    if (nativeCurrency !== prevProps.nativeCurrency) {
      setTimeout(() => {
        this.rlv && this.rlv.scrollToTop(false);
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
      ((this.rlv && this.rlv.getCurrentScrollOffset()) || 0) +
      RecyclerAssetListSharedState.globalDeviceDimensions;

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
            this.state.dataProvider._data,
            function (data) {
              return (
                data.item?.familyName ===
                safeCollectibles.data[safeIndex].familyName
              );
            }
          );

          const focusedFamilyItem = this.state.dataProvider._data[familyIndex]
            .item;
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
            this.rlv.getLayout(familyIndex).y - AssetListHeaderHeight;

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
      this.rlv &&
      this.rlv.getContentDimension().height <
        bottomHorizonOfScreen +
          ViewTypes.FOOTER.calculateHeight({
            paddingBottom: this.props.paddingBottom || 0,
          }) &&
      this.rlv.getCurrentScrollOffset() > 0 &&
      (!this.props.isCoinListEdited ||
        (!prevProps.isCoinListEdited && this.props.isCoinListEdited))
    ) {
      setTimeout(() => {
        this.rlv && this.rlv.scrollToEnd({ animated: true });
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
        this.state.dataProvider._data,
        function (data) {
          return data.item?.familyName === 'Showcase';
        }
      );

      const startOfDesiredComponent =
        this.rlv.getLayout(familyIndex).y - AssetListHeaderHeight;
      this.scrollToOffset(startOfDesiredComponent, true);
    }
  }

  rlv = React.createRef();

  layoutMeasurement = 0;

  position = 0;

  renderList = [];

  scrollToOffset(position, animated) {
    setTimeout(() => {
      this.rlv && this.rlv.scrollToOffset(0, position, animated);
    }, 5);
  }

  getStableId = index => {
    const { dataProvider } = this.state;
    const row = get(dataProvider, `_data[${index}]`);

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

    if (index === dataProvider._data.length - 1) {
      return 'footer';
    }

    return index;
  };

  handleListRef = ref => {
    this.rlv = ref;
  };

  render() {
    const {
      externalScrollView,
      hideHeader,
      renderAheadOffset,
      isCoinListEdited,
    } = this.props;
    const {
      dataProvider,
      sectionsIndices,
      stickyComponentsIndices,
    } = this.state;

    const { colors, onScroll } = this.props;

    return (
      <>
        <StickyContainer
          overrideRowRenderer={this.props.stickyRowRenderer}
          stickyHeaderIndices={isCoinListEdited ? [0] : stickyComponentsIndices}
        >
          <RecyclerListView
            dataProvider={dataProvider}
            extendedState={{ sectionsIndices }}
            externalScrollView={externalScrollView}
            itemAnimator={this.animator}
            layoutProvider={this.layoutProvider}
            onScroll={onScroll}
            ref={this.handleListRef}
            renderAheadOffset={renderAheadOffset}
            rowRenderer={this.props.rowRenderer}
            scrollIndicatorInsets={{
              bottom: safeAreaInsetValues.bottom,
              top: hideHeader ? 0 : AssetListHeaderHeight,
            }}
            scrollViewProps={{
              refreshControl: this.props.renderRefreshControl(),
            }}
            style={{
              backgroundColor: colors.white,
              flex: 1,
              minHeight: 1,
            }}
          />
        </StickyContainer>
      </>
    );
  }
}
