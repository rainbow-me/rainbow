/* eslint-disable sort-keys */
/* eslint-disable react-native/no-unused-styles */
// eslint-disable-next-line import/extensions
import emoji from 'emoji-datasource';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import 'string.fromcodepoint';
import EmojiTabBarShadow from '../../assets/emojiTabBarShadow.png';
import { colors, position } from '../../styles';
import TabBar from './TabBar';
import {
  RecyclerListView,
  DataProvider,
  LayoutProvider,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import { deviceUtils } from '../../utils';
import { State, TapGestureHandler } from 'react-native-gesture-handler';

export const Categories = {
  // all: {
  //   icon: null,
  //   name: 'All',
  // },
  // history: {
  //   icon: "emojiRecent",
  //   name: "Recently Used"
  // },
  people: {
    icon: 'emojiSmileys',
    index: 0,
    name: 'Smileys & People',
  },
  nature: {
    icon: 'emojiAnimals',
    index: 1,
    name: 'Animals & Nature',
  },
  food: {
    icon: 'emojiFood',
    index: 2,
    name: 'Food & Drink',
  },
  activities: {
    icon: 'emojiActivities',
    index: 3,
    name: 'Activities',
  },
  places: {
    icon: 'emojiTravel',
    index: 4,
    name: 'Travel & Places',
  },
  objects: {
    icon: 'emojiObjects',
    index: 5,
    name: 'Objects',
  },
  icons: {
    icon: 'emojiSymbols',
    index: 6,
    name: 'Symbols',
  },
  flags: {
    icon: 'emojiFlags',
    index: 7,
    name: 'Flags',
  },
};

const charFromUtf16 = utf16 =>
  String.fromCodePoint(...utf16.split('-').map(u => '0x' + u));
export const charFromEmojiObject = obj => charFromUtf16(obj.unified);
const filteredEmojis = emoji.filter(e => !e['obsoleted_by']);
const emojiByCategory = category =>
  filteredEmojis.filter(e => e.category === category);
const sortEmoji = list => list.sort((a, b) => a.sort_order - b.sort_order);
const { width } = Dimensions.get('screen');
const categoryKeys = Object.keys(Categories);

const EmojiCell = ({ emoji, colNumber, colSize, ...other }) => (
  <TouchableOpacity
    activeOpacity={0.5}
    {...other}
    style={{ backgroundColor: 'white' }}
  >
    <Text
      style={{
        fontSize: Math.floor(colSize) - 15,
        height: (width - 21) / colNumber,
        textAlign: 'center',
        width: (width - 21) / colNumber,
      }}
    >
      {charFromEmojiObject(emoji)}
    </Text>
  </TouchableOpacity>
);

const EMOJI_CONTAINER = 1;
const HEADER_ROW = 2;

const storage_key = '@react-native-emoji-selector:HISTORY';

let currentIndex = 0;
let blockCategories = true;

export default class EmojiSelector extends PureComponent {
  constructor(args) {
    super(args);

    this.state = {
      allEmojiList: [],
      category: Categories.people,
      colSize: 0,
      emojiList: [],
      history: [],
      isReady: false,
      searchQuery: '',
    };

    this.recentlyRendered = false;
    this.touchedContact = undefined;
    this.contacts = {};

    this._layoutProvider = new LayoutProvider(
      i => {
        if (i % 2 == 0) {
          return HEADER_ROW;
        }
        return EMOJI_CONTAINER;
      },
      (type, dim, i) => {
        if (type === EMOJI_CONTAINER) {
          dim.height =
            Math.floor(this.state.allEmojiList[i].data.length / 7 + 1) *
            ((width - 21) / this.props.columns);
          dim.width = deviceUtils.dimensions.width;
        } else if (type === HEADER_ROW) {
          dim.height = 35;
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
    }, 5000);
  }

  handleTabSelect = category => {
    blockCategories = true;
    this.scrollToOffset(
      category.index * 2 - 1 > 0
        ? this.state.allEmojiList[category.index * 2 - 1].offset
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
    if (this.props.showHistory) {
      this.addToHistoryAsync(emoji);
    }
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  };

  handleSearch = searchQuery => {
    this.setState({ searchQuery });
  };

  addToHistoryAsync = async e => {
    let history = await AsyncStorage.getItem(storage_key);

    let value = [];
    if (!history) {
      // no history
      let record = Object.assign({}, e, { count: 1 });
      value.push(record);
    } else {
      let json = JSON.parse(history);
      if (json.filter(r => r.unified === e.unified).length > 0) {
        value = json;
      } else {
        let record = Object.assign({}, e, { count: 1 });
        value = [record, ...json];
      }
    }

    AsyncStorage.setItem(storage_key, JSON.stringify(value));
    this.setState({
      history: value,
    });
  };

  loadHistoryAsync = async () => {
    let result = await AsyncStorage.getItem(storage_key);
    if (result) {
      let history = JSON.parse(result);
      this.setState({ history });
    }
  };

  renderEmojiCell = item => (
    <EmojiCell
      key={item.key}
      emoji={item.emoji}
      onPress={() => this.handleEmojiSelect(item.emoji)}
      colSize={this.state.colSize}
      colNumber={this.props.columns}
    />
  );

  renderEmojis = ({ data }) => {
    let categoryEmojis = [];
    for (let i = 0; i < data.length; i += this.props.columns) {
      let rowContent = [];
      for (let j = 0; j < this.props.columns; j++) {
        if (i + j < data.length) {
          rowContent.push(this.renderEmojiCell(data[i + j]));
        }
      }
      categoryEmojis.push(
        <View style={{ flexDirection: 'row', marginHorizontal: 10 }}>
          {rowContent}
        </View>
      );
    }
    // return <View>{categoryEmojis}</View>;
    return <View>{categoryEmojis}</View>;
  };

  renderListHeader = title => {
    return (
      this.props.showSectionTitles && (
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeader}>{title}</Text>
        </View>
      )
    );
  };

  loadEmojis(cb) {
    let allEmojiList = [];
    let offset = 0;
    categoryKeys.map(category => {
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
    });

    this.setState(
      {
        allEmojiList,
        colSize: width / this.props.columns,
      },
      cb
    );
  }

  hasRowChanged = (r1, r2) => {
    if (r1 !== r2) {
      return true;
    }
    return false;
  };

  renderItem = (type, item) => {
    if (type === HEADER_ROW) {
      return this.renderListHeader(item.title);
    }
    return this.renderEmojis(item);
  };

  handleScroll = (event, offsetX, offsetY) => {
    if (!blockCategories) {
      if (
        offsetY > this.state.allEmojiList[(currentIndex + 1) * 2 - 1].offset
      ) {
        currentIndex += 1;
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      } else if (
        currentIndex * 2 - 1 > 0 &&
        offsetY < this.state.allEmojiList[currentIndex * 2 - 1].offset
      ) {
        currentIndex -= 1;
        this.setState({ category: Categories[categoryKeys[currentIndex]] });
      }
    }
  };

  scrollToOffset = (position, animated) => {
    this.rlv.scrollToOffset(0, position, animated);
  };

  handleListRef = ref => {
    this.rlv = ref;
  };

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
          style={styles.search}
          placeholder={placeholder}
          clearButtonMode="always"
          returnKeyType="done"
          autoCorrect={false}
          underlineColorAndroid={theme}
          value={searchQuery}
          onChangeText={this.handleSearch}
        />
      </View>
    );

    return (
      <View style={styles.frame} {...other}>
        <TapGestureHandler onHandlerStateChange={this.onTapChange}>
          <View
            style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
          >
            {showSearchBar && Searchbar}
            {!isReady && (
              <View style={styles.loader} {...other}>
                <ActivityIndicator
                  size="large"
                  color={Platform.OS === 'android' ? theme : '#000000'}
                />
              </View>
            )}
            <View style={styles.container}>
              <StickyContainer
                stickyHeaderIndices={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]}
              >
                <RecyclerListView
                  dataProvider={new DataProvider(
                    this.hasRowChanged
                  ).cloneWithRows(this.state.allEmojiList)}
                  layoutProvider={this._layoutProvider}
                  rowRenderer={this.renderItem}
                  style={{ width: deviceUtils.dimensions.width }}
                  renderAheadOffset={10000}
                  onScroll={this.handleScroll}
                  renderFooter={() => <View style={{ height: 100 }} />}
                  ref={this.handleListRef}
                />
              </StickyContainer>
            </View>
          </View>
        </TapGestureHandler>

        {showTabs && (
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
                borderRadius={17}
                overflow="hidden"
                colors={['#FFFFFF', '#FFFFFF', '#F0F5FA']}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
                start={{ x: 0.5, y: 0 }}
                style={position.coverAsObject}
              />
            </View>
            <TabBar
              activeCategory={category}
              onPress={this.handleTabSelect}
              theme={theme}
              categoryKeys={categoryKeys}
            />
          </View>
        )}
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

  /** Number of columns accross */
  columns: PropTypes.number,
};

EmojiSelector.defaultProps = {
  category: Categories.people,
  columns: 7,
  placeholder: 'Search...',
  showHistory: false,
  showSearchBar: true,
  showSectionTitles: true,
  showTabs: true,
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
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'absolute',
  },
  row: {
    alignItems: 'center',
  },
  search: {
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderRadius: 10,
        height: 36,
        paddingLeft: 8,
      },
    }),
    margin: 8,
  },
  searchbar_container: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    width: '100%',
    zIndex: 1,
  },
  sectionHeader: {
    color: '#3C4252',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    paddingBottom: 5,
    paddingLeft: 8.3,
    paddingRight: 4,
    paddingTop: 15,
    // textAlign: "center",
    textTransform: 'uppercase',
    width: '100%',
  },
  sectionHeaderWrap: {
    backgroundColor: '#ffffffdd',
    marginRight: 10,
    paddingLeft: 10,
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
