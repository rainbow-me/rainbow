import emoji from 'emoji-datasource';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Dimensions,
  SectionList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RadialGradient from 'react-native-radial-gradient';
import 'string.fromcodepoint';
import EmojiTabBarShadow from '../../assets/emojiTabBarShadow.png';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Icon from '../icons/Icon';
import TabBar from './TabBar';
import {
  RecyclerListView,
  DataProvider,
  LayoutProvider,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import { deviceUtils } from '../../utils';

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
    name: 'Smileys & People',
  },
  nature: {
    icon: 'emojiAnimals',
    name: 'Animals & Nature',
  },
  food: {
    icon: 'emojiFood',
    name: 'Food & Drink',
  },
  activities: {
    icon: 'emojiActivities',
    name: 'Activities',
  },
  places: {
    icon: 'emojiTravel',
    name: 'Travel & Places',
  },
  objects: {
    icon: 'emojiObjects',
    name: 'Objects',
  },
  icons: {
    icon: 'emojiSymbols',
    name: 'Symbols',
  },
  flags: {
    icon: 'emojiFlags',
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
  <TouchableOpacity activeOpacity={0.5} {...other}>
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

export default class EmojiSelector extends PureComponent {
  constructor(args) {
    super(args);

    this.state = {
      allEmojiList: [],
      category: Categories.people,
      colSize: 0,
      emojiList: [],
      history: [],
      isReady: true,
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
          console.log(this.state.allEmojiList[i]);
          dim.height =
            Math.floor(this.state.allEmojiList[i].data.length / 7 + 1) * 56.5;
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
    this.prerenderEmojis();
  }

  handleTabSelect = category => {
    if (this.state.isReady) {
      if (this.scrollview) {
        if (category == this.state.category) {
          this.scrollview.scrollToOffset({ animated: true, x: 0, y: 0 });
        } else {
          this.scrollview.scrollToOffset({ animated: false, x: 0, y: 0 });
        }
        this.scrollview.scrollToOffset({ animated: true, x: 2000, y: 0 });
      }
      this.setState({
        searchQuery: '',
        category,
      });
    }
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

  prerenderEmojis(cb) {
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
        const height = Math.floor(emojiCategory[1].data.length / 7 + 1) * 56.5;
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
    if (offsetY > this.state.allEmojiList[(currentIndex + 1) * 2 - 1].offset) {
      currentIndex += 1;
      this.setState({ category: Categories[categoryKeys[currentIndex]] });
    } else if (
      currentIndex * 2 - 1 > 0 &&
      offsetY < this.state.allEmojiList[currentIndex * 2 - 1].offset
    ) {
      currentIndex -= 1;
      this.setState({ category: Categories[categoryKeys[currentIndex]] });
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
        <View style={{ flex: 1 }}>
          {showSearchBar && Searchbar}
          {isReady ? (
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
                />
              </StickyContainer>
            </View>
          ) : (
            <View style={styles.loader} {...other}>
              <ActivityIndicator
                size="large"
                color={Platform.OS === 'android' ? theme : '#000000'}
              />
            </View>
          )}
        </View>
        {showTabs && (
          <View style={styles.tabBar}>
            <Image
              opacity={0.6}
              pointerEvents="none"
              source={EmojiTabBarShadow}
              style={{
                position: 'absolute',
                height: 138,
                left: -50.5,
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
  theme: '#007AFF',
  category: Categories.people,
  showTabs: true,
  showSearchBar: true,
  showHistory: false,
  showSectionTitles: true,
  columns: 7,
  placeholder: 'Search...',
};

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  searchbar_container: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    width: '100%',
    zIndex: 1,
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    width: width,
  },
  row: {
    alignItems: 'center',
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
});
