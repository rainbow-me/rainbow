import { findIndex, get, has, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import { LayoutAnimation, RefreshControl, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { compose, pure } from 'recompact';
import {
  BaseItemAnimator,
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import {
  withAccountSettings,
  withCoinListEdited,
  withFabSelection,
  withOpenBalances,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
  withOpenSavings,
} from '../../hoc';
import { colors } from '../../styles';
import {
  deviceUtils,
  isNewValueForPath,
  safeAreaInsetValues,
} from '../../utils';
import { CoinDivider, SmallBalancesWrapper } from '../coin-divider';
import { CoinRow } from '../coin-row';
import SavingsListWrapper from '../savings/SavingsListWrapper';
import AssetListHeader from './AssetListHeader';
import { ViewTypes } from './RecyclerViewTypes';

const NOOP = () => undefined;

class LayoutItemAnimator extends BaseItemAnimator {
  animateDidMount = NOOP;
  animateShift = () =>
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        initialVelocity: 0,
        springDamping: 1,
        type: LayoutAnimation.Types.spring,
      },
    });
  animateWillMount = NOOP;
  animateWillUnmount = NOOP;
  animateWillUpdate = NOOP;
}

const layoutItemAnimator = new LayoutItemAnimator();

let smallBalancedChanged = false;
let smallBalancesIndex = 0;

const AssetListHeaderRenderer = pure(data => <AssetListHeader {...data} />);

const hasRowChanged = (r1, r2) => {
  const isNewTitle = isNewValueForPath(r1, r2, 'title');
  const isNewTotalItems = isNewValueForPath(r1, r2, 'totalItems');
  const isNewTotalValue = isNewValueForPath(r1, r2, 'totalValue');
  const isNewAsset = isNewValueForPath(r1, r2, 'item.uniqueId');
  const isNewTokenFamilyId = isNewValueForPath(r1, r2, 'item.familyId');
  const isNewTokenFamilyName = isNewValueForPath(r1, r2, 'item.familyName');
  const isNewTokenFamilySize = isNewValueForPath(r1, r2, 'item.childrenAmount');
  const isNewUniswapPercentageOwned = isNewValueForPath(
    r1,
    r2,
    'item.percentageOwned'
  );
  const isNewUniswapToken = isNewValueForPath(r1, r2, 'item.tokenSymbol');
  const isPinned = isNewValueForPath(r1, r2, 'item.isPinned');

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

  let savingsSectionChanged = false;
  if (
    r1.item &&
    r2.item &&
    r1.item.assets &&
    r2.item.assets &&
    r1.item.savingsContainer &&
    r2.item.savingsContainer
  ) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      savingsSectionChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].supplyRate) {
          if (r1.item.assets[i].supplyRate !== r2.item.assets[i].supplyRate) {
            savingsSectionChanged = true;
          }
        } else if (r1.item.assets[i].supplyBalanceUnderlying) {
          if (
            r1.item.assets[i].supplyBalanceUnderlying !==
            r2.item.assets[i].supplyBalanceUnderlying
          ) {
            savingsSectionChanged = true;
          }
        }
      }
    }
  }

  if (!isCollectiblesRow) {
    isNewAssetBalance = isNewValueForPath(
      r1,
      r2,
      'item.native.balance.display'
    );
  }

  if (
    r1.item &&
    r2.item &&
    r1.item.assets &&
    r2.item.assets &&
    r1.item.smallBalancesContainer &&
    r2.item.smallBalancesContainer
  ) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      smallBalancedChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].native && r2.item.assets[i].native) {
          if (
            get(r1.item.assets[i].native, 'balance.display', null) !==
              get(r2.item.assets[i].native, 'balance.display', null) ||
            r1.item.assets[i].isHidden !== r2.item.assets[i].isHidden
          ) {
            smallBalancedChanged = true;
          }
        } else if (r1.item.assets[i].isHidden !== r2.item.assets[i].isHidden) {
          smallBalancedChanged = true;
        }
      }
    }
  }

  return (
    isNewAsset ||
    isNewAssetBalance ||
    isNewTitle ||
    isNewTokenFamilyId ||
    isNewTokenFamilyName ||
    isNewTokenFamilySize ||
    isNewTotalItems ||
    isNewTotalValue ||
    isNewUniswapPercentageOwned ||
    isNewUniswapToken ||
    isPinned ||
    savingsSectionChanged ||
    smallBalancedChanged
  );
};

class RecyclerAssetList extends Component {
  static propTypes = {
    externalScrollView: PropTypes.any,
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    openFamilyTabs: PropTypes.object,
    openInvestmentCards: PropTypes.object,
    openSavings: PropTypes.bool,
    openSmallBalances: PropTypes.bool,
    paddingBottom: PropTypes.number,
    renderAheadOffset: PropTypes.number,
    scrollingVelocity: PropTypes.number,
    scrollViewTracker: PropTypes.object,
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
        investments: PropTypes.bool,
        perData: PropTypes.object,
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
      headersIndices: [],
      isRefreshing: false,
      itemsCount: 0,
      showCoinListEditor: false,
      stickyComponentsIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        const { openFamilyTabs, openInvestmentCards, sections } = this.props;

        const { headersIndices } = this.state;
        if (headersIndices.includes(index)) {
          return {
            height: ViewTypes.HEADER.calculateHeight({
              hideHeader: this.props.hideHeader,
            }),
            index: ViewTypes.HEADER.index,
          };
        }

        if (index === this.state.itemsCount - 1) {
          return {
            height: ViewTypes.FOOTER.calculateHeight(),
            index: ViewTypes.FOOTER.index,
          };
        }

        const balancesIndex = findIndex(
          sections,
          ({ name }) => name === 'balances'
        );
        const collectiblesIndex = findIndex(
          sections,
          ({ name }) => name === 'collectibles'
        );
        const investmentsIndex = findIndex(
          sections,
          ({ name }) => name === 'investments'
        );

        if (balancesIndex > -1) {
          if (
            index <= headersIndices[collectiblesIndex] &&
            index <= headersIndices[investmentsIndex]
          ) {
            const balanceItemsCount = get(
              sections,
              `[${balancesIndex}].data.length`,
              0
            );
            const lastBalanceIndex =
              headersIndices[balancesIndex] + balanceItemsCount;
            if (index === lastBalanceIndex - 2) {
              if (this.coinDividerIndex !== index) {
                this.coinDividerIndex = index;
                if (this.props.isCoinListEdited) {
                  this.checkEditStickyHeader(this.rlv.getCurrentScrollOffset());
                }
              }
              if (
                sections[balancesIndex].data[lastBalanceIndex - 2]
                  .smallBalancesContainer
              ) {
                return {
                  height: ViewTypes.COIN_DIVIDER.calculateHeight(),
                  index: ViewTypes.COIN_DIVIDER.index,
                };
              }
            }
            if (index === lastBalanceIndex - 1) {
              if (
                sections[balancesIndex].data[lastBalanceIndex - 2] &&
                sections[balancesIndex].data[lastBalanceIndex - 2]
                  .smallBalancesContainer
              ) {
                smallBalancesIndex = index - 1;
                return {
                  height: ViewTypes.COIN_SMALL_BALANCES.calculateHeight({
                    isCoinListEdited: this.props.isCoinListEdited,
                    isOpen: this.props.openSmallBalances,
                    smallBalancesLength:
                      sections[balancesIndex].data[smallBalancesIndex].assets
                        .length,
                  }),
                  index: ViewTypes.COIN_SMALL_BALANCES.index,
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
                      sections[balancesIndex].data[index - 1].assets.length,
                    isLast: index === this.state.itemsCount - 2,
                    isOpen: this.props.openSavings,
                    paddingBottom: this.props.paddingBottom,
                  }),
                  index: ViewTypes.COIN_SAVINGS.index,
                };
              }
              this.lastAssetIndex = index;
            }
            const firstBalanceIndex = headersIndices[balancesIndex] + 1;

            return {
              height: ViewTypes.COIN_ROW.calculateHeight({
                areSmallCollectibles: this.state.areSmallCollectibles,
                isFirst:
                  index === firstBalanceIndex &&
                  !sections[balancesIndex].data[firstBalanceIndex - 1]
                    .smallBalancesContainer,
                isLast: index === lastBalanceIndex,
              }),
              index: ViewTypes.COIN_ROW.index,
              isFirst:
                index === firstBalanceIndex &&
                !sections[balancesIndex].data[firstBalanceIndex - 1]
                  .smallBalancesContainer,
            };
          }
        }

        if (investmentsIndex > -1) {
          const investmentItemsCount = get(
            sections,
            `[${investmentsIndex}].data.length`,
            0
          );
          const lastInvestmentIndex =
            headersIndices[investmentsIndex] + investmentItemsCount;

          if (
            index > headersIndices[investmentsIndex] &&
            index <= lastInvestmentIndex
          ) {
            const isOpen = !openInvestmentCards[
              sections[investmentsIndex].data[
                index - headersIndices[investmentsIndex] - 1
              ].uniqueId
            ];

            return {
              height: ViewTypes.UNISWAP_ROW.calculateHeight({
                isLast: index === lastInvestmentIndex,
                isOpen,
              }),
              index: ViewTypes.UNISWAP_ROW.index,
            };
          }
        }

        if (collectiblesIndex > -1) {
          if (index > headersIndices[collectiblesIndex]) {
            const familyIndex = index - headersIndices[collectiblesIndex] - 1;
            return {
              height: ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight({
                amountOfRows: get(
                  sections,
                  `[${collectiblesIndex}].data[${familyIndex}].tokens`,
                  []
                ).length,
                isFirst: index === headersIndices[collectiblesIndex] + 1,
                isLast: index === this.state.itemsCount - 2,
                isOpen:
                  openFamilyTabs[
                    sections[collectiblesIndex].data[familyIndex].familyName
                  ],
                paddingBottom: this.props.paddingBottom,
              }),
              index: ViewTypes.UNIQUE_TOKEN_ROW.index,
            };
          }
        }

        return {
          height: ViewTypes.UNKNOWN.calculateHeight(),
          index: ViewTypes.UNKNOWN.index,
        };
      },
      (type, dim) => {
        // TODO Set height 0 for selected indexes when isCoinListEdited
        dim.width = deviceUtils.dimensions.width;
        dim.height = type.height;
      }
    );
  }

  static getDerivedStateFromProps({ sections }, state) {
    const headersIndices = [];
    const stickyComponentsIndices = [];
    const items = sections.reduce((ctx, section) => {
      headersIndices.push(ctx.length);
      stickyComponentsIndices.push(ctx.length);
      return ctx
        .concat([
          {
            isHeader: true,
            ...section.header,
          },
        ])
        .concat(
          section.data.map(item => ({
            item: { ...item, ...section.perData },
            renderItem: section.renderItem,
          }))
        );
    }, []);
    items.push({ item: { isLastPlaceholder: true }, renderItem: () => null });
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(
      sections.find(e => e.collectibles)
    );
    return {
      areSmallCollectibles,
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      itemsCount: items.length,
      stickyComponentsIndices,
    };
  }

  componentDidMount = () => {
    this.isCancelled = false;
  };

  componentDidUpdate(prevProps) {
    // Movable FAB Logic

    // const { openFamilyTabs, sections, scrollingVelocity } = this.props;

    // if (scrollingVelocity === 0) {
    //   clearTimeout(this.scrollHandle);
    // }

    // if (
    //   scrollingVelocity &&
    //   scrollingVelocity !== prevProps.scrollingVelocity
    // ) {
    //   this.startScroll(scrollingVelocity);
    // }

    const { openFamilyTabs, sections } = this.props;

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

    const headerHeaight = deviceUtils.isSmallPhone ? 210 : 148;
    const deviceDimensions = deviceUtils.dimensions.height - headerHeaight;
    const bottomHorizonOfScreen =
      this.rlv.getCurrentScrollOffset() + deviceDimensions;

    if (openFamilyTabs !== prevProps.openFamilyTabs && collectibles.data) {
      let i = 0;
      while (i < collectibles.data.length) {
        if (
          openFamilyTabs[collectibles.data[i].familyName] === true &&
          !prevProps.openFamilyTabs[collectibles.data[i].familyName]
        ) {
          const familyIndex = findIndex(this.state.dataProvider._data, function(
            data
          ) {
            return data.item?.familyName === collectibles.data[i].familyName;
          });

          const focusedFamilyItem = this.state.dataProvider._data[familyIndex]
            .item;
          const focusedFamilyHeight = ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight(
            {
              amountOfRows: Math.ceil(
                Number(focusedFamilyItem.childrenAmount) / 2
              ),
              isFirst: false,
              isLast: false,
              isOpen: true,
              paddingBottom: this.props.paddingBottom,
            }
          );

          const startOfDesiredComponent =
            this.rlv.getLayout(familyIndex).y - AssetListHeader.height;

          if (focusedFamilyHeight < deviceDimensions) {
            const endOfDesiredComponent =
              startOfDesiredComponent + focusedFamilyHeight;

            const scrollFixedBonusOffset = AssetListHeader.height;

            if (
              endOfDesiredComponent + scrollFixedBonusOffset >
              bottomHorizonOfScreen
            ) {
              this.scrollToOffset(
                endOfDesiredComponent +
                  scrollFixedBonusOffset -
                  deviceDimensions,
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

    if (
      this.rlv.getContentDimension().height < bottomHorizonOfScreen &&
      this.rlv.getCurrentScrollOffset() > 0
    ) {
      layoutItemAnimator.animateShift = () =>
        LayoutAnimation.configureNext({
          duration: 250,
          update: {
            delay: 10,
            type: 'easeInEaseOut',
          },
        });
      setTimeout(() => {
        this.rlv.scrollToEnd({ animated: true });
      }, 10);
      setTimeout(() => {
        layoutItemAnimator.animateShift = () =>
          LayoutAnimation.configureNext({
            duration: 200,
            update: {
              initialVelocity: 0,
              springDamping: 1,
              type: LayoutAnimation.Types.spring,
            },
          });
      }, 250);
    }

    if (
      collectibles.data &&
      prevCollectibles.data &&
      collectibles.data[0].familyName === 'Showcase' &&
      (collectibles.data[0].childrenAmount !==
        prevCollectibles.data[0].childrenAmount ||
        prevCollectibles.data[0].familyName !== 'Showcase')
    ) {
      const familyIndex = findIndex(this.state.dataProvider._data, function(
        data
      ) {
        return data.item?.familyName === 'Showcase';
      });

      const startOfDesiredComponent =
        this.rlv.getLayout(familyIndex).y - AssetListHeader.height;
      this.scrollToOffset(startOfDesiredComponent, true);
    }
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
    clearTimeout(this.scrollHandle);
  };

  rlv = React.createRef();

  contentSize = 0;

  layoutMeasurement = 0;

  position = 0;

  renderList = [];
  savingsList = [];
  savingsSumValue = 0;

  checkEditStickyHeader = offsetY => {
    const offsetHeight = CoinRow.height * (this.coinDividerIndex - 1) + 5;
    if (this.props.isCoinListEdited && offsetY > offsetHeight) {
      this.setState({ showCoinListEditor: true });
    } else if (
      (offsetY < offsetHeight || !this.props.isCoinListEdited) &&
      this.state.showCoinListEditor === true
    ) {
      this.setState({ showCoinListEditor: false });
    }
  };

  // Movable FAB Logic

  // startScroll = scrollingVelocity => {
  //   clearTimeout(this.scrollHandle);
  //   this.rlv.scrollToOffset(0, this.position + scrollingVelocity * 10);
  //   this.scrollHandle = setTimeout(this.startScroll, 30);
  // };

  scrollToOffset = (position, animated) => {
    setTimeout(() => {
      this.rlv.scrollToOffset(0, position, animated);
    }, 5);
  };

  getStableId = index => {
    const { dataProvider } = this.state;
    const row = get(dataProvider, `_data[${index}]`);

    if (row.isHeader) {
      return `header_${row.title}`;
    }

    if (row.item && row.item.address) {
      return `balance_${row.item.address}`;
    }

    if (row.item && row.item.uniqueId) {
      return `investment_${row.item.uniqueId}`;
    }

    if (row.item && row.item.familyName) {
      return `family_${row.item.familyName}`;
    }

    if (row.item && row.item.smallBalancesContainer) {
      return `balance_${row.item.stableId}`;
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

  handleRefresh = () => {
    if (this.state.isRefreshing) return;

    this.setState({ isRefreshing: true }, () => {
      this.props
        .fetchData()
        .then(() => {
          if (!this.isCancelled) {
            this.setState({ isRefreshing: false });
          }
        })
        .catch(() => {
          if (!this.isCancelled) {
            this.setState({ isRefreshing: false });
          }
        });
    });
  };

  handleScroll = (_nativeEventObject, _, offsetY) => {
    // Movable FAB Logic

    // const { contentSize, layoutMeasurement } = nativeEvent;

    // if (this.contentSize !== contentSize.height) {
    //   this.contentSize = contentSize.height;
    // }

    // if (this.layoutMeasurement !== layoutMeasurement.height) {
    //   this.layoutMeasurement = layoutMeasurement.height;
    // }

    // if (
    //   ((contentSize.height - layoutMeasurement.height >= offsetY &&
    //     offsetY >= 0) ||
    //     (offsetY < reloadHeightOffsetTop &&
    //       offsetY > reloadHeightOffsetBottom)) &&
    //   this.props.scrollViewTracker
    // ) {
    //   this.props.scrollViewTracker.setValue(offsetY);
    // }

    if (this.props.isCoinListEdited) {
      this.checkEditStickyHeader(offsetY);
    }
  };

  renderRefreshControl = () => (
    <RefreshControl
      onRefresh={this.handleRefresh}
      refreshing={this.state.isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );

  rowRenderer = (type, data, index) => {
    if (isNil(data) || isNil(index)) {
      return null;
    }

    const { item = {}, renderItem } = data;
    const { hideHeader, sections, isCoinListEdited } = this.props;

    if (isCoinListEdited && !(type.index < 4)) {
      return null;
    }

    if (type.index === ViewTypes.HEADER.index) {
      return hideHeader ? null : (
        <AssetListHeaderRenderer
          {...data}
          isCoinListEdited={this.props.isCoinListEdited}
        />
      );
    }

    if (type.index === ViewTypes.COIN_SAVINGS.index) {
      return (
        <SavingsListWrapper assets={item.assets} totalValue={item.totalValue} />
      );
    }

    if (type.index === ViewTypes.COIN_SMALL_BALANCES.index) {
      if (
        this.renderList.length !== item.assets.length ||
        smallBalancedChanged
      ) {
        smallBalancedChanged = false;
        const renderList = [];
        for (let i = 0; i < item.assets.length; i++) {
          renderList.push(
            renderItem({
              item: {
                ...item.assets[i],
                isSmall: true,
              },
              key: `CoinSmallBalances${item.assets[i].symbol}`,
            })
          );
        }
        this.renderList = renderList;
      }

      return <SmallBalancesWrapper assets={this.renderList} />;
    }

    if (type.index === ViewTypes.COIN_DIVIDER.index) {
      return (
        <CoinDivider
          assetsAmount={item.assetsAmount}
          balancesSum={item.value}
          isCoinListEdited={isCoinListEdited}
          nativeCurrency={this.props.nativeCurrency}
        />
      );
    }

    const isFirstCoinRow = type.isFirst;

    if (
      type.index === ViewTypes.COIN_ROW.index ||
      type.index === ViewTypes.UNISWAP_ROW.index
    ) {
      return renderItem({ isFirstCoinRow, item });
    }
    if (type.index === ViewTypes.UNIQUE_TOKEN_ROW.index) {
      return renderItem({
        childrenAmount: item.childrenAmount,
        familyId: item.familyId,
        familyImage: item.familyImage,
        familyName: item.familyName,
        isFirst: type.isFirst,
        item: item.tokens,
        shouldPrioritizeImageLoading:
          index < get(sections, '[0].data.length', 0) + 9,
        uniqueId: item.uniqueId,
      });
    }
  };

  stickyRowRenderer = (_, data) => (
    <Fragment>
      <AssetListHeaderRenderer {...data} isSticky />
      {this.state.showCoinListEditor ? (
        <CoinDivider
          assetsAmount={this.renderList.length}
          balancesSum={0}
          isSticky
          nativeCurrency={this.props.nativeCurrency}
          onEndEdit={() => {
            this.setState({ showCoinListEditor: false });
          }}
        />
      ) : null}
    </Fragment>
  );

  render() {
    const {
      externalScrollView,
      fetchData,
      hideHeader,
      renderAheadOffset,
      isCoinListEdited,
    } = this.props;
    const {
      dataProvider,
      headersIndices,
      stickyComponentsIndices,
    } = this.state;

    return (
      <View backgroundColor={colors.white} flex={1} overflow="hidden">
        <PanGestureHandler enabled={isCoinListEdited}>
          <StickyContainer
            overrideRowRenderer={this.stickyRowRenderer}
            stickyHeaderIndices={
              isCoinListEdited ? [0] : stickyComponentsIndices
            }
          >
            <RecyclerListView
              dataProvider={dataProvider}
              disableRecycling
              extendedState={{ headersIndices }}
              externalScrollView={externalScrollView}
              itemAnimator={layoutItemAnimator}
              layoutProvider={this.layoutProvider}
              onScroll={this.handleScroll}
              ref={this.handleListRef}
              renderAheadOffset={renderAheadOffset}
              rowRenderer={this.rowRenderer}
              scrollIndicatorInsets={{
                bottom: safeAreaInsetValues.bottom,
                top: hideHeader ? 0 : AssetListHeader.height,
              }}
              scrollViewProps={{
                refreshControl: fetchData && this.renderRefreshControl(),
              }}
              style={{
                backgroundColor: colors.white,
                flex: 1,
                minHeight: 1,
              }}
            />
          </StickyContainer>
        </PanGestureHandler>
      </View>
    );
  }
}

export default compose(
  withCoinListEdited,
  withFabSelection,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
  withOpenBalances,
  withOpenSavings,
  withAccountSettings
)(RecyclerAssetList);
