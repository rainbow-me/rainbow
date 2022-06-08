/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable react-native/no-unused-styles */
import { BlurView } from '@react-native-community/blur';
import React, { PureComponent, RefCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { getBrand } from 'react-native-device-info';
import {
  State as GestureHandlerState,
  TouchableOpacity as GHTouchableOpacity,
  ScrollView,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Value } from 'react-native-reanimated';
import {
  DataProvider,
  LayoutProvider,
  ProgressiveListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import 'string.fromcodepoint';
import { ScrollEvent } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import EmojiTabBarShadow from '../../assets/emojiTabBarShadow.png';
import {
  ThemeContextProps,
  withThemeContext,
} from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { Categories } from './Categories';
import TabBar from './TabBar';
import { charFromEmojiObject } from './helpers/charFromEmojiObject';
import getFormattedAllEmojiList, {
  AllEmojiContentEntry,
  AllEmojiEntry,
  AllEmojiHeaderEntry,
} from './helpers/getFormattedAllEmojiList';
import { EmojiCategory, EmojiEntry } from './types';
import { ImgixImage } from '@rainbow-me/images';
import { fonts, position } from '@rainbow-me/styles';

// TODO width attribute is temporary solution that will be removed as soon as I figure out why proper scaling does not work – comment from 2019
const { width } = Dimensions.get('screen');

const categoryKeys = Object.keys(Categories);

const EMOJI_CONTAINER = 1;
const HEADER_ROW = 2;
const OVERLAY = 3;

let currentIndex = 0;
let scrollPosition = new Value(0);
let nextCategoryOffset = new Value(1);
let blockCategories = true;

type Props = {
  /** Function called when a user selects an Emoji */
  onEmojiSelected: (emojiCode: string) => void;
  /** Toggle the tabs on or off */
  showTabs?: boolean;
  /** Toggle the history section on or off */
  showHistory?: boolean;
  /** Toggle section title on or off */
  showSectionTitles?: boolean;
  /** Set the default category. Use the `Categories` class */
  category: EmojiCategory;
  /** Number of columns across */
  columns: number;
  /** Theme color used for loaders and active tab indicator */
  theme?: string;
} & ThemeContextProps;

interface State {
  allEmojiList: AllEmojiEntry[];
  category: EmojiCategory;
  colSize: number;
  emojiList: string[];
  history: string[];
  isReady: boolean;
}

class EmojiSelector extends PureComponent<Props, State> {
  constructor(args: any) {
    super(args);
    this.renderScrollView = this.renderScrollView.bind(this);

    this.state = {
      allEmojiList: [],
      category: Categories.people,
      colSize: 0,
      emojiList: [],
      history: [],
      isReady: false,
    };

    nextCategoryOffset = new Value(1);

    this._layoutProvider = new LayoutProvider(
      i => {
        if (i === 0 || i === this.state.allEmojiList.length - 1) {
          return OVERLAY;
        }
        if (i % 2 === 0) {
          return EMOJI_CONTAINER;
        }
        return HEADER_ROW;
      },
      (type, dim, i) => {
        if (type === EMOJI_CONTAINER) {
          const entry = this.state.allEmojiList[i] as AllEmojiContentEntry;
          dim.height =
            Math.floor(entry.data.length / 7 + 1) *
            ((width - 21) / this.props.columns);
          dim.width = deviceUtils.dimensions.width;
        } else if (type === HEADER_ROW) {
          dim.height = 34.7;
          dim.width = deviceUtils.dimensions.width;
        } else if (type === OVERLAY) {
          dim.height = i === 0 ? 0.1 : 100;
          dim.width = deviceUtils.dimensions.width;
        } else {
          dim.height = 0;
          dim.width = 0;
        }
      }
    );
  }

  componentDidMount() {
    this.loadEmojis();
    setTimeout(() => {
      this.setState({ isReady: true });
    }, 300);
  }

  private _layoutProvider: LayoutProvider;
  private recyclerListView: ScrollView | null = null;

  handleTabSelect = (category: EmojiCategory) => {
    blockCategories = true;
    this.scrollToOffset(
      category.index * 2 - 1 > 0
        ? (this.state.allEmojiList[category.index * 2] as AllEmojiContentEntry)
            .offset ?? 0
        : 0,
      true
    );
    currentIndex = category.index;
    this.setState({
      category,
    });
  };

  handleEmojiSelect = (emoji: EmojiEntry) => {
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  };

  renderEmojis({ data }: AllEmojiContentEntry) {
    let categoryEmojis = [];
    for (let i = 0; i < data.length; i += this.props.columns) {
      let rowContent = [];
      let touchableNet = [];
      for (let j = 0; j < this.props.columns; j++) {
        if (i + j < data.length) {
          rowContent.push(charFromEmojiObject(data[i + j].emoji));
          touchableNet.push(data[i + j].emoji);
        }
      }
      categoryEmojis.push({
        rowContent,
        touchableNet,
      });
    }
    const { colors } = this.props;
    return (
      <View>
        {categoryEmojis.map(({ rowContent, touchableNet }) => (
          <View key={`categoryEmoji${rowContent[0]}`}>
            <Text
              style={{
                color: colors.black,
                marginHorizontal: 10,
                fontSize: Math.floor(this.state.colSize) - (ios ? 15 : 22),
                height: (width - 21) / this.props.columns,
                width: deviceUtils.dimensions.width,
                letterSpacing: ios ? 8 : getBrand() === 'google' ? 11 : 8,
                backgroundColor: colors.white,
              }}
            >
              {rowContent}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                marginHorizontal: 10,
                position: 'absolute',
              }}
            >
              {touchableNet.map(singleLine => {
                const touchableProps = {
                  key: `categoryEmojiTouchableOpacity${rowContent[0]}${singleLine.sort_order}`,
                  onPress: () => this.handleEmojiSelect(singleLine),
                  style: {
                    height: (width - 21) / this.props.columns,
                    width: (width - 21) / this.props.columns,
                    opacity: 0,
                    backgroundColor: colors.white,
                  },
                };
                return ios ? (
                  <TouchableOpacity activeOpacity={0.5} {...touchableProps} />
                ) : (
                  <GHTouchableOpacity activeOpacity={0.7} {...touchableProps} />
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  renderListHeader = (title: string) => {
    const { colors } = this.props;
    return (
      this.props.showSectionTitles && (
        <Animated.View
          style={[
            sx.sectionHeaderWrap,
            { backgroundColor: colors.white, opacity: nextCategoryOffset },
          ]}
        >
          <Text
            style={[
              sx.sectionHeader,
              { color: colors.alpha(colors.blueGreyDark, 0.5) },
            ]}
          >
            {title}
          </Text>
        </Animated.View>
      )
    );
  };

  loadEmojis() {
    const allEmojiList = getFormattedAllEmojiList(
      categoryKeys,
      this.props.columns
    );

    this.setState({
      allEmojiList,
      colSize: width / this.props.columns,
    });
  }

  hasRowChanged = () => {
    return false;
  };

  renderItem = (type: number, item: AllEmojiEntry, index: number) => {
    const { colors } = this.props;

    if (type === HEADER_ROW) {
      return this.renderListHeader((item as AllEmojiHeaderEntry).title);
    } else if (type === OVERLAY) {
      const overlayStyle: ViewStyle = {};
      if (index === 0) {
        overlayStyle.top = -3000;
      } else {
        overlayStyle.bottom = -3000;
      }

      return ios ? (
        <View
          style={[
            sx.header,
            {
              width: width,
              backgroundColor: colors.white,
            },
            overlayStyle,
          ]}
        />
      ) : null;
    }
    return this.renderEmojis(item as AllEmojiContentEntry);
  };

  renderStickyItem = (
    type: string | number | undefined,
    item: AllEmojiHeaderEntry,
    index: number
  ) => {
    const { colors } = this.props;
    return (
      <View style={sx.sectionStickyHeaderWrap}>
        <Animated.View
          // @ts-expect-error
          style={{
            opacity: scrollPosition,
          }}
        >
          {ios ? (
            <BlurView
              blurAmount={10}
              blurType="light"
              style={[
                sx.sectionStickyBlur,
                {
                  width:
                    (index - 1) / 2 <= categoryKeys.length - 1
                      ? Categories[categoryKeys[(index - 1) / 2]].width
                      : Categories[categoryKeys[categoryKeys.length - 1]].width,
                },
              ]}
            >
              <Text
                style={[
                  sx.sectionStickyHeader,
                  { backgroundColor: colors.alpha(colors.white, 0.7) },
                ]}
              >
                {item.title}
              </Text>
            </BlurView>
          ) : (
            <View style={sx.sectionStickyBlur}>
              <Text
                style={[
                  sx.sectionStickyHeader,
                  { color: colors.alpha(colors.blueGreyDark, 0.5) },
                ]}
              >
                {item.title}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  handleScroll = (event: ScrollEvent, offsetX: number, offsetY: number) => {
    if (!blockCategories) {
      if (
        offsetY - 0.5 >
          // @ts-expect-error
          this.state.allEmojiList[(currentIndex + 1) * 2].offset &&
        currentIndex < this.state.allEmojiList.length / 2 - 2
      ) {
        currentIndex += 1;
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      } else if (
        currentIndex * 2 - 1 > 0 &&
        // @ts-expect-error
        offsetY - 0.5 < this.state.allEmojiList[currentIndex * 2].offset
      ) {
        currentIndex -= 1;
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      }
      scrollPosition.setValue(
        // @ts-expect-error
        -offsetY + this.state.allEmojiList[(currentIndex + 1) * 2].offset > 40
          ? 1
          : (-offsetY +
              // @ts-expect-error
              this.state.allEmojiList[(currentIndex + 1) * 2].offset) /
              40
      );
      nextCategoryOffset.setValue(
        // @ts-expect-error
        -offsetY + this.state.allEmojiList[(currentIndex + 1) * 2].offset <
          400 || offsetY < 1
          ? 1
          : 0
      );
    }
  };

  handleListRef: RefCallback<ScrollView> = ref => {
    this.recyclerListView = ref;
  };

  scrollToOffset = (position: number, animated?: boolean) => {
    this.recyclerListView?.scrollTo(position, 0, animated);
  };

  prerenderEmojis(emojisRows: string[][]) {
    const { colors } = this.props;
    return (
      <View style={{ marginTop: 34 }}>
        {emojisRows.map(emojis => (
          <Text
            key={`emojiRow${emojis[0]}`}
            style={{
              color: colors.black,
              marginHorizontal: 10,
              fontSize: Math.floor(this.state.colSize) - (ios ? 15 : 22),
              height: (width - 21) / this.props.columns,
              width: deviceUtils.dimensions.width,
              letterSpacing: ios ? 8 : getBrand() === 'google' ? 11 : 8,
              top: 0.8,
            }}
          >
            {emojis}
          </Text>
        ))}
      </View>
    );
  }

  // @ts-expect-error
  renderScrollView({ children, ...props }) {
    const prerenderEmoji: string[][] = [];
    if (this.state.allEmojiList[2]) {
      for (let i = 0; i < this.props.columns * 10; i += this.props.columns) {
        let emojis = [];
        for (let j = 0; j < this.props.columns; j++) {
          emojis.push(
            charFromEmojiObject(
              (this.state.allEmojiList[2] as AllEmojiContentEntry).data[i + j]
                .emoji
            )
          );
        }
        prerenderEmoji.push(emojis);
      }
    }

    return (
      <ScrollView {...props} ref={this.handleListRef}>
        {this.state.isReady ? children : this.prerenderEmojis(prerenderEmoji)}
      </ScrollView>
    );
  }

  onTapChange = ({
    nativeEvent: { state },
  }: TapGestureHandlerStateChangeEvent) => {
    if (state === GestureHandlerState.BEGAN) {
      blockCategories = false;
    }
  };

  render() {
    const { showTabs, colors, isDarkMode, ...other } = this.props;

    const { category, isReady } = this.state;

    return (
      <View style={sx.frame} {...other}>
        <TapGestureHandler onHandlerStateChange={this.onTapChange}>
          <View
            style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
          >
            {!isReady ? (
              <View style={sx.loader} {...other}>
                <View
                  style={[
                    sx.sectionHeaderWrap,
                    { backgroundColor: colors.white },
                  ]}
                >
                  <Text
                    style={[
                      sx.sectionHeader,
                      { color: colors.alpha(colors.blueGreyDark, 0.5) },
                    ]}
                  >
                    {Categories.people.getTitle()}
                  </Text>
                </View>
                {null}
              </View>
            ) : null}
            <View style={sx.container}>
              <StickyContainer
                overrideRowRenderer={this.renderStickyItem}
                stickyHeaderIndices={[1, 3, 5, 7, 9, 11, 13, 15, 17]}
              >
                {/* @ts-expect-error */}
                <ProgressiveListView
                  canChangeSize={false}
                  dataProvider={new DataProvider(
                    this.hasRowChanged
                  ).cloneWithRows(this.state.allEmojiList)}
                  // @ts-expect-error
                  externalScrollView={this.renderScrollView}
                  layoutProvider={this._layoutProvider}
                  onScroll={this.handleScroll}
                  renderAheadOffset={300}
                  renderAheadStep={100}
                  // @ts-expect-error
                  rowRenderer={this.renderItem}
                  scrollIndicatorInsets={[15, 0, 15, 0]}
                  style={{ width: deviceUtils.dimensions.width }}
                />
              </StickyContainer>
            </View>
          </View>
        </TapGestureHandler>
        {showTabs ? (
          <View style={sx.tabBar}>
            <View
              style={[
                sx.tabBarShadowImage,
                { opacity: isDarkMode ? 0.3 : 0.6 },
              ]}
            >
              <ImgixImage
                pointerEvents="none"
                // @ts-expect-error
                source={EmojiTabBarShadow}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View
              style={[
                { shadowColor: colors.shadowBlack },
                sx.gradientContainer,
              ]}
            >
              <LinearGradient
                colors={[
                  colors.white,
                  colors.white,
                  isDarkMode ? colors.white : '#F0F5FA',
                ]}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
                start={{ x: 0.5, y: 0 }}
                style={sx.gradient}
              />
            </View>
            <TabBar
              activeCategory={category}
              categoryKeys={categoryKeys}
              onPress={this.handleTabSelect}
            />
          </View>
        ) : null}
      </View>
    );
  }
}

// @ts-expect-error
EmojiSelector.defaultProps = {
  category: Categories.people,
  columns: 7,
  showHistory: false,
  showSearchBar: true,
  showSectionTitles: true,
  showTabs: ios,
  theme: '#007AFF',
};

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
    width: width,
  },
  header: { height: 400, position: 'absolute' },
  frame: {
    flex: 1,
  },
  loader: {
    flex: 1,
    position: 'absolute',
    width: width,
    top: 0,
  },
  row: {
    alignItems: 'center',
  },
  searchbar_container: {
    width: '100%',
    zIndex: 1,
  },
  sectionHeader: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: fonts.size.small,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.rounded,
    paddingBottom: 3.75,
    paddingLeft: 9,
    paddingRight: 9,
    paddingTop: 15.25,
    textTransform: 'uppercase',
    width: '100%',
  },
  sectionHeaderWrap: {
    marginRight: 10,
    paddingLeft: 10,
  },
  sectionStickyHeaderWrap: {
    marginLeft: 12,
    flex: 1,
  },
  sectionStickyHeader: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: fonts.size.small,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.rounded,
    paddingBottom: 3.75,
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 3.25,
    textTransform: 'uppercase',
  },
  sectionStickyBlur: {
    borderRadius: 11,
    marginTop: 12,
  },
  tabBar: {
    alignSelf: 'center',
    bottom: 24,
    flexDirection: 'row',
    height: 38,
    justifyContent: 'space-between',
    padding: 4,
    position: 'absolute',
    width: 276,
  },
  tabBarShadowImage: {
    height: 138,
    left: -50.5,
    position: 'absolute',
    top: -46,
    width: 377,
  },
  gradient: {
    borderRadius: 19,
    overflow: 'hidden',
    ...position.coverAsObject,
  },
  gradientContainer: {
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 0.5,
    ...position.coverAsObject,
  },
});

export default withThemeContext(EmojiSelector);
