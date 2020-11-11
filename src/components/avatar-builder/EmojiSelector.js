/* eslint-disable sort-keys */
/* eslint-disable react-native/no-unused-styles */
import { BlurView } from '@react-native-community/blur';
import emoji from 'emoji-datasource';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBrand } from 'react-native-device-info';
import {
  TouchableOpacity as GHTouchableOpacity,
  ScrollView,
  State,
  TapGestureHandler,
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
import EmojiTabBarShadow from '../../assets/emojiTabBarShadow.png';
import { deviceUtils } from '../../utils';
import { Categories } from './Categories';
import TabBar from './TabBar';
import { colors, fonts, position } from '@rainbow-me/styles';

// TODO width attribute is temporary solution that will be removed as soon as I figure out why proper scaling does not work

const charFromUtf16 = utf16 =>
  String.fromCodePoint(...utf16.split('-').map(u => '0x' + u));
export const charFromEmojiObject = obj => charFromUtf16(obj.unified);
const filteredEmojis = emoji.filter(e => !e['obsoleted_by']);
const emojiByCategory = category =>
  filteredEmojis.filter(e => e.category === category);
const sortEmoji = list => list.sort((a, b) => a.sort_order - b.sort_order);
const { width } = Dimensions.get('screen');
const categoryKeys = Object.keys(Categories);

const EMOJI_CONTAINER = 1;
const HEADER_ROW = 2;
const OVERLAY = 3;

let currentIndex = 0;
let scrollPosition = new Value(0);
let nextCategoryOffset = new Value(1);
let blockCategories = true;

export default class EmojiSelector extends PureComponent {
  constructor(args) {
    super(args);
    this.renderScrollView = this.renderScrollView.bind(this);

    this.state = {
      allEmojiList: [],
      category: Categories.people,
      colSize: 0,
      emojiList: [],
      history: [],
      isReady: false,
      searchQuery: '',
    };

    nextCategoryOffset = new Value(1);
    this.contacts = {};

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
          dim.height =
            Math.floor(this.state.allEmojiList[i].data.length / 7 + 1) *
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

  handleTabSelect = category => {
    blockCategories = true;
    this.scrollToOffset(
      category.index * 2 - 1 > 0
        ? this.state.allEmojiList[category.index * 2].offset
        : 0,
      true
    );
    currentIndex = category.index;
    this.setState({
      category,
      searchQuery: '',
    });
  };

  handleEmojiSelect = emoji => {
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  };

  renderEmojis({ data }) {
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
                    backgroundColor: 'white',
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

  renderListHeader = title => {
    return (
      this.props.showSectionTitles && (
        <Animated.View
          style={[styles.sectionHeaderWrap, { opacity: nextCategoryOffset }]}
        >
          <Text style={styles.sectionHeader}>{title}</Text>
        </Animated.View>
      )
    );
  };

  loadEmojis() {
    let allEmojiList = [{ overlay: true }];
    let offset = 0;
    let keys = categoryKeys;
    keys.map(category => {
      const emojiCategory = [
        { header: true, title: Categories[category].name },
        {
          data: sortEmoji(emojiByCategory(Categories[category].name)).map(
            emoji => ({
              emoji,
              key: emoji.unified,
            })
          ),
          emoji: true,
        },
      ];
      if (emojiCategory[1].data.length > 0) {
        const height =
          Math.floor(emojiCategory[1].data.length / 7 + 1) *
          ((width - 21) / this.props.columns);
        emojiCategory[1].height = height;
        offset += height + 35;
        emojiCategory[1].offset = offset;
        allEmojiList = allEmojiList.concat(emojiCategory);
      }
      return true;
    });

    allEmojiList.push({ overlay: true });

    this.setState({
      allEmojiList,
      colSize: width / this.props.columns,
    });
  }

  hasRowChanged = () => {
    return false;
  };

  renderItem = (type, item, index) => {
    if (type === HEADER_ROW) {
      return this.renderListHeader(item.title);
    } else if (type === OVERLAY) {
      return ios ? (
        <View
          style={{
            top: index === 0 && -3000,
            bottom: index !== 0 && -3000,
            height: 400,
            width: width,
            backgroundColor: colors.white,
            position: 'absolute',
          }}
        />
      ) : null;
    }
    return this.renderEmojis(item);
  };

  renderStickyItem = (type, item, index) => (
    <View style={styles.sectionStickyHeaderWrap}>
      <Animated.View
        style={{
          opacity: scrollPosition,
        }}
      >
        {ios ? (
          <BlurView
            blurAmount={10}
            blurType="light"
            style={[
              styles.sectionStickyBlur,
              {
                width:
                  (index - 1) / 2 <= categoryKeys.length - 1
                    ? Categories[categoryKeys[(index - 1) / 2]].width
                    : Categories[categoryKeys[categoryKeys.length - 1]].width,
              },
            ]}
          >
            <Text style={styles.sectionStickyHeader}>{item.title}</Text>
          </BlurView>
        ) : (
          <View style={styles.sectionStickyBlur}>
            <Text style={styles.sectionStickyHeader}>{item.title}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );

  handleScroll = (event, offsetX, offsetY) => {
    if (!blockCategories) {
      if (
        offsetY - 0.5 >
          this.state.allEmojiList[(currentIndex + 1) * 2].offset &&
        currentIndex < this.state.allEmojiList.length / 2 - 2
      ) {
        currentIndex += 1;
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      } else if (
        currentIndex * 2 - 1 > 0 &&
        offsetY - 0.5 < this.state.allEmojiList[currentIndex * 2].offset
      ) {
        currentIndex -= 1;
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      }
      scrollPosition.setValue(
        -offsetY + this.state.allEmojiList[(currentIndex + 1) * 2].offset > 40
          ? 1
          : (-offsetY +
              this.state.allEmojiList[(currentIndex + 1) * 2].offset) /
              40
      );
      nextCategoryOffset.setValue(
        -offsetY + this.state.allEmojiList[(currentIndex + 1) * 2].offset <
          400 || offsetY < 1
          ? 1
          : 0
      );
    }
  };

  handleListRef = ref => {
    this.rlv = ref;
  };

  scrollToOffset = (position, animated) => {
    this.rlv.scrollTo(position, 0, animated);
  };

  prerenderEmojis(emojisRows) {
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

  renderScrollView({ children, ...props }) {
    const prerenderEmoji = [];
    if (this.state.allEmojiList[2]) {
      for (let i = 0; i < this.props.columns * 10; i += this.props.columns) {
        let emojis = [];
        for (let j = 0; j < this.props.columns; j++) {
          emojis.push(
            charFromEmojiObject(this.state.allEmojiList[2].data[i + j].emoji)
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

  onTapChange = ({ nativeEvent: { state } }) => {
    if (state === State.BEGAN) {
      blockCategories = false;
    }
  };

  render() {
    const {
      theme,
      placeholder,
      showSearchBar,
      showTabs,
      ...other
    } = this.props;

    const { category, isReady, searchQuery } = this.state;

    const Searchbar = (
      <View style={styles.searchbar_container}>
        <TextInput
          autoCorrect={false}
          clearButtonMode="always"
          onChangeText={this.handleSearch}
          placeholder={placeholder}
          returnKeyType="done"
          style={styles.search}
          underlineColorAndroid={theme}
          value={searchQuery}
        />
      </View>
    );

    return (
      <View style={styles.frame} {...other}>
        <TapGestureHandler onHandlerStateChange={this.onTapChange}>
          <View
            style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
          >
            {showSearchBar ? Searchbar : null}
            {!isReady ? (
              <View style={styles.loader} {...other}>
                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionHeader}>Smileys & People</Text>
                </View>
                {null}
              </View>
            ) : null}
            <View style={styles.container}>
              <StickyContainer
                overrideRowRenderer={this.renderStickyItem}
                stickyHeaderIndices={[1, 3, 5, 7, 9, 11, 13, 15, 17]}
              >
                <ProgressiveListView
                  canChangeSize={false}
                  dataProvider={new DataProvider(
                    this.hasRowChanged
                  ).cloneWithRows(this.state.allEmojiList)}
                  externalScrollView={this.renderScrollView}
                  layoutProvider={this._layoutProvider}
                  onScroll={this.handleScroll}
                  renderAheadOffset={300}
                  renderAheadStep={100}
                  rowRenderer={this.renderItem}
                  scrollIndicatorInsets={[15, 0, 15, 0]}
                  style={{ width: deviceUtils.dimensions.width }}
                />
              </StickyContainer>
            </View>
          </View>
        </TapGestureHandler>
        {showTabs ? (
          <View style={styles.tabBar}>
            <Image
              opacity={0.6}
              pointerEvents="none"
              source={EmojiTabBarShadow}
              style={{
                height: 138,
                left: -50.5,
                position: 'absolute',
                top: -46,
                width: 377,
              }}
            />
            <View
              shadowColor={colors.black}
              shadowOffset={{ height: 0, width: 0 }}
              shadowOpacity={0.06}
              shadowRadius={0.5}
              style={position.coverAsObject}
            >
              <LinearGradient
                borderRadius={19}
                colors={['#FFFFFF', '#FFFFFF', '#F0F5FA']}
                end={{ x: 0.5, y: 1 }}
                overflow="hidden"
                pointerEvents="none"
                start={{ x: 0.5, y: 0 }}
                style={position.coverAsObject}
              />
            </View>
            <TabBar
              activeCategory={category}
              categoryKeys={categoryKeys}
              onPress={this.handleTabSelect}
              theme={theme}
            />
          </View>
        ) : null}
      </View>
    );
  }
}

EmojiSelector.propTypes = {
  /** Function called when a user selects an Emoji */
  onEmojiSelected: PropTypes.func.isRequired,

  /** Theme color used for loaders and active tab indicator */
  theme: PropTypes.string,

  /** Placeholder of search input */
  placeholder: PropTypes.string,

  /** Toggle the tabs on or off */
  showTabs: PropTypes.bool,

  /** Toggle the searchbar on or off */
  showSearchBar: PropTypes.bool,

  /** Toggle the history section on or off */
  showHistory: PropTypes.bool,

  /** Toggle section title on or off */
  showSectionTitles: PropTypes.bool,

  /** Set the default category. Use the `Categories` class */
  category: PropTypes.object,

  /** Number of columns across */
  columns: PropTypes.number,
};

EmojiSelector.defaultProps = {
  category: Categories.people,
  columns: 7,
  placeholder: 'Search...',
  showHistory: false,
  showSearchBar: true,
  showSectionTitles: true,
  showTabs: ios,
  theme: '#007AFF',
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
    width: width,
  },
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
  search: {
    ...Platform.select({
      ios: {
        backgroundColor: colors.alpha(colors.white, 0.75),
        borderRadius: 10,
        height: 36,
        paddingLeft: 8,
      },
    }),
    margin: 8,
  },
  searchbar_container: {
    backgroundColor: colors.alpha(colors.white, 0.75),
    width: '100%',
    zIndex: 1,
  },
  sectionHeader: {
    color: colors.alpha(colors.blueGreyDark, 0.5),
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.small),
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
    backgroundColor: colors.white,
    marginRight: 10,
    paddingLeft: 10,
  },
  sectionStickyHeaderWrap: {
    marginLeft: 12,
    flex: 1,
  },
  sectionStickyHeader: {
    backgroundColor: colors.alpha(colors.white, 0.7),
    color: colors.alpha(colors.blueGreyDark, 0.5),
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.small),
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
});
