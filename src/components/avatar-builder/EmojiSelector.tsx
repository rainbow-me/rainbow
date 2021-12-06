/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable react-native/no-unused-styles */
import { BlurView } from '@react-native-community/blur';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'emoji-datasource' or its corre... Remove this comment to see the full error message
import emoji from 'emoji-datasource';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  Dimensions,
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
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { withThemeContext } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { Categories } from './Categories';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TabBar' was resolved to '/Users/nickbyte... Remove this comment to see the full error message
import TabBar from './TabBar';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, position } from '@rainbow-me/styles';

// TODO width attribute is temporary solution that will be removed as soon as I figure out why proper scaling does not work

const charFromUtf16 = (utf16: any) =>
  String.fromCodePoint(...utf16.split('-').map((u: any) => '0x' + u));
export const charFromEmojiObject = (obj: any) => charFromUtf16(obj.unified);
const filteredEmojis = emoji.filter((e: any) => !e['obsoleted_by']);
const emojiByCategory = (category: any) =>
  filteredEmojis.filter((e: any) => e.category === category);
const sortEmoji = (list: any) =>
  list.sort((a: any, b: any) => a.sort_order - b.sort_order);
const { width } = Dimensions.get('screen');
const categoryKeys = Object.keys(Categories);

const EMOJI_CONTAINER = 1;
const HEADER_ROW = 2;
const OVERLAY = 3;

let currentIndex = 0;
let scrollPosition = new Value(0);
let nextCategoryOffset = new Value(1);
let blockCategories = true;

class EmojiSelector extends PureComponent {
  _layoutProvider: any;
  contacts: any;
  handleSearch: any;
  rlv: any;
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
      searchQuery: '',
    };

    nextCategoryOffset = new Value(1);
    this.contacts = {};

    this._layoutProvider = new LayoutProvider(
      i => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
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
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
            Math.floor(this.state.allEmojiList[i].data.length / 7 + 1) *
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
            ((width - 21) / this.props.columns);
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
          dim.width = deviceUtils.dimensions.width;
        } else if (type === HEADER_ROW) {
          dim.height = 34.7;
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
          dim.width = deviceUtils.dimensions.width;
        } else if (type === OVERLAY) {
          dim.height = i === 0 ? 0.1 : 100;
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
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

  handleTabSelect = (category: any) => {
    blockCategories = true;
    this.scrollToOffset(
      category.index * 2 - 1 > 0
        ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
          this.state.allEmojiList[category.index * 2].offset
        : 0,
      true
    );
    currentIndex = category.index;
    this.setState({
      category,
      searchQuery: '',
    });
  };

  handleEmojiSelect = (emoji: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onEmojiSelected' does not exist on type ... Remove this comment to see the full error message
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  };

  renderEmojis({ data }: any) {
    let categoryEmojis = [];
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
    for (let i = 0; i < data.length; i += this.props.columns) {
      let rowContent = [];
      let touchableNet = [];
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { colors } = this.props;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View>
        {categoryEmojis.map(({ rowContent, touchableNet }) => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <View key={`categoryEmoji${rowContent[0]}`}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: colors.black,
                marginHorizontal: 10,
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'colSize' does not exist on type 'Readonl... Remove this comment to see the full error message
                fontSize: Math.floor(this.state.colSize) - (ios ? 15 : 22),
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
                height: (width - 21) / this.props.columns,
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
                width: deviceUtils.dimensions.width,
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
                letterSpacing: ios ? 8 : getBrand() === 'google' ? 11 : 8,
                backgroundColor: colors.white,
              }}
            >
              {rowContent}
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
                    // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
                    height: (width - 21) / this.props.columns,
                    // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
                    width: (width - 21) / this.props.columns,
                    opacity: 0,
                    backgroundColor: colors.white,
                  },
                };
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
                return ios ? (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <TouchableOpacity activeOpacity={0.5} {...touchableProps} />
                ) : (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <GHTouchableOpacity activeOpacity={0.7} {...touchableProps} />
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  renderListHeader = (title: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { colors } = this.props;
    return (
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'showSectionTitles' does not exist on typ... Remove this comment to see the full error message
      this.props.showSectionTitles && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Animated.View
          style={[
            styles.sectionHeaderWrap,
            { backgroundColor: colors.white, opacity: nextCategoryOffset },
          ]}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            style={[
              styles.sectionHeader,
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
    let allEmojiList = [{ overlay: true }];
    let offset = 0;
    let keys = categoryKeys;
    keys.map(category => {
      const emojiCategory = [
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        { header: true, title: Categories[category].name },
        {
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          data: sortEmoji(emojiByCategory(Categories[category].name)).map(
            (emoji: any) => ({
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
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
          ((width - 21) / this.props.columns);
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type '{ header... Remove this comment to see the full error message
        emojiCategory[1].height = height;
        offset += height + 35;
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'offset' does not exist on type '{ header... Remove this comment to see the full error message
        emojiCategory[1].offset = offset;
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        allEmojiList = allEmojiList.concat(emojiCategory);
      }
      return true;
    });

    allEmojiList.push({ overlay: true });

    this.setState({
      allEmojiList,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
      colSize: width / this.props.columns,
    });
  }

  hasRowChanged = () => {
    return false;
  };

  renderItem = (type: any, item: any, index: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { colors } = this.props;

    if (type === HEADER_ROW) {
      return this.renderListHeader(item.title);
    } else if (type === OVERLAY) {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      return ios ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
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

  renderStickyItem = (type: any, item: any, index: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { colors } = this.props;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View style={styles.sectionStickyHeaderWrap}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View
          style={{
            opacity: scrollPosition,
          }}
        >
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
          {ios ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <BlurView
              blurAmount={10}
              blurType="light"
              style={[
                styles.sectionStickyBlur,
                {
                  width:
                    (index - 1) / 2 <= categoryKeys.length - 1
                      ? // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                        Categories[categoryKeys[(index - 1) / 2]].width
                      : // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                        Categories[categoryKeys[categoryKeys.length - 1]].width,
                },
              ]}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                style={[
                  styles.sectionStickyHeader,
                  { backgroundColor: colors.alpha(colors.white, 0.7) },
                ]}
              >
                {item.title}
              </Text>
            </BlurView>
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <View style={styles.sectionStickyBlur}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                style={[
                  styles.sectionStickyHeader,
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

  handleScroll = (event: any, offsetX: any, offsetY: any) => {
    if (!blockCategories) {
      if (
        offsetY - 0.5 >
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
          this.state.allEmojiList[(currentIndex + 1) * 2].offset &&
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
        currentIndex < this.state.allEmojiList.length / 2 - 2
      ) {
        currentIndex += 1;
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      } else if (
        currentIndex * 2 - 1 > 0 &&
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
        offsetY - 0.5 < this.state.allEmojiList[currentIndex * 2].offset
      ) {
        currentIndex -= 1;
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      }
      scrollPosition.setValue(
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
        -offsetY + this.state.allEmojiList[(currentIndex + 1) * 2].offset > 40
          ? 1
          : (-offsetY +
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
              this.state.allEmojiList[(currentIndex + 1) * 2].offset) /
              40
      );
      nextCategoryOffset.setValue(
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '0 | 1' is not assignable to para... Remove this comment to see the full error message
        -offsetY + this.state.allEmojiList[(currentIndex + 1) * 2].offset <
          400 || offsetY < 1
          ? 1
          : 0
      );
    }
  };

  handleListRef = (ref: any) => {
    this.rlv = ref;
  };

  scrollToOffset = (position: any, animated: any) => {
    this.rlv.scrollTo(position, 0, animated);
  };

  prerenderEmojis(emojisRows: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { colors } = this.props;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View style={{ marginTop: 34 }}>
        {emojisRows.map((emojis: any) => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Text
            key={`emojiRow${emojis[0]}`}
            style={{
              color: colors.black,
              marginHorizontal: 10,
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'colSize' does not exist on type 'Readonl... Remove this comment to see the full error message
              fontSize: Math.floor(this.state.colSize) - (ios ? 15 : 22),
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
              height: (width - 21) / this.props.columns,
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
              width: deviceUtils.dimensions.width,
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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

  renderScrollView({ children, ...props }: any) {
    const prerenderEmoji = [];
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
    if (this.state.allEmojiList[2]) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
      for (let i = 0; i < this.props.columns * 10; i += this.props.columns) {
        let emojis = [];
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'columns' does not exist on type 'Readonl... Remove this comment to see the full error message
        for (let j = 0; j < this.props.columns; j++) {
          emojis.push(
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
            charFromEmojiObject(this.state.allEmojiList[2].data[i + j].emoji)
          );
        }
        prerenderEmoji.push(emojis);
      }
    }

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ScrollView {...props} ref={this.handleListRef}>
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'isReady' does not
        exist on type 'Readonl... Remove this comment to see the full error
        message
        {this.state.isReady ? children : this.prerenderEmojis(prerenderEmoji)}
      </ScrollView>
    );
  }

  onTapChange = ({ nativeEvent: { state } }: any) => {
    if (state === State.BEGAN) {
      blockCategories = false;
    }
  };

  render() {
    const {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
      theme,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'placeholder' does not exist on type 'Rea... Remove this comment to see the full error message
      placeholder,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'showSearchBar' does not exist on type 'R... Remove this comment to see the full error message
      showSearchBar,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'showTabs' does not exist on type 'Readon... Remove this comment to see the full error message
      showTabs,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
      colors,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isDarkMode' does not exist on type 'Read... Remove this comment to see the full error message
      isDarkMode,
      ...other
    } = this.props;

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'category' does not exist on type 'Readon... Remove this comment to see the full error message
    const { category, isReady, searchQuery } = this.state;

    const Searchbar = (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View
        style={[
          styles.searchbar_container,
          { backgroundColor: colors.alpha(colors.white, 0.75) },
        ]}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TextInput
          autoCorrect={false}
          clearButtonMode="always"
          onChangeText={this.handleSearch}
          placeholder={placeholder}
          returnKeyType="done"
          style={{
            ...Platform.select({
              ios: {
                backgroundColor: colors.alpha(colors.white, 0.75),
                borderRadius: 10,
                height: 36,
                paddingLeft: 8,
              },
            }),
            margin: 8,
          }}
          underlineColorAndroid={theme}
          value={searchQuery}
        />
      </View>
    );

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View style={styles.frame} {...other}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TapGestureHandler onHandlerStateChange={this.onTapChange}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View
            style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
          >
            {showSearchBar ? Searchbar : null}
            {!isReady ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <View style={styles.loader} {...other}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <View
                  style={[
                    styles.sectionHeaderWrap,
                    { backgroundColor: colors.white },
                  ]}
                >
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Text
                    style={[
                      styles.sectionHeader,
                      { color: colors.alpha(colors.blueGreyDark, 0.5) },
                    ]}
                  >
                    Smileys & People
                  </Text>
                </View>
                {null}
              </View>
            ) : null}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View style={styles.container}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <StickyContainer
                overrideRowRenderer={this.renderStickyItem}
                stickyHeaderIndices={[1, 3, 5, 7, 9, 11, 13, 15, 17]}
              >
                // @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is
                not assignable to type 'Recycler... Remove this comment to see
                the full error message
                <ProgressiveListView
                  canChangeSize={false}
                  dataProvider={new DataProvider(
                    this.hasRowChanged
                    // @ts-expect-error ts-migrate(2339) FIXME: Property 'allEmojiList' does not exist on type 'Re... Remove this comment to see the full error message
                  ).cloneWithRows(this.state.allEmojiList)}
                  // @ts-expect-error ts-migrate(2322) FIXME: Type '({ children, ...props }: any) => Element' is... Remove this comment to see the full error message
                  externalScrollView={this.renderScrollView}
                  layoutProvider={this._layoutProvider}
                  onScroll={this.handleScroll}
                  renderAheadOffset={300}
                  renderAheadStep={100}
                  rowRenderer={this.renderItem}
                  scrollIndicatorInsets={[15, 0, 15, 0]}
                  // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
                  style={{ width: deviceUtils.dimensions.width }}
                />
              </StickyContainer>
            </View>
          </View>
        </TapGestureHandler>
        {showTabs ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <View style={styles.tabBar}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={[
                styles.tabBarShadowImage,
                { opacity: isDarkMode ? 0.3 : 0.6 },
              ]}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ImgixImage
                pointerEvents="none"
                source={EmojiTabBarShadow}
                style={StyleSheet.absoluteFill}
              />
            </View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
              shadowColor={colors.shadowBlack}
              shadowOffset={{ height: 0, width: 0 }}
              shadowOpacity={0.06}
              shadowRadius={0.5}
              style={position.coverAsObject}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <LinearGradient
                // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
                borderRadius={19}
                colors={[
                  colors.white,
                  colors.white,
                  isDarkMode ? colors.white : '#F0F5FA',
                ]}
                end={{ x: 0.5, y: 1 }}
                overflow="hidden"
                pointerEvents="none"
                start={{ x: 0.5, y: 0 }}
                style={position.coverAsObject}
              />
            </View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
EmojiSelector.defaultProps = {
  category: Categories.people,
  columns: 7,
  placeholder: 'Search...',
  showHistory: false,
  showSearchBar: true,
  showSectionTitles: true,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
  searchbar_container: {
    width: '100%',
    zIndex: 1,
  },
  sectionHeader: {
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
    marginRight: 10,
    paddingLeft: 10,
  },
  sectionStickyHeaderWrap: {
    marginLeft: 12,
    flex: 1,
  },
  sectionStickyHeader: {
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
  tabBarShadowImage: {
    height: 138,
    left: -50.5,
    position: 'absolute',
    top: -46,
    width: 377,
  },
});

export default withThemeContext(EmojiSelector);
