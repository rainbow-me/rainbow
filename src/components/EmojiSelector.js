import emoji from 'emoji-datasource';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Dimensions,
  FlatList,
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
import EmojiTabBarShadow from '../assets/emojiTabBarShadow.png';
import { colors, position } from '../styles';
import { ButtonPressAnimation } from './animations';
import Icon from './icons/Icon';

export const Categories = {
  all: {
    icon: null,
    name: 'All',
  },
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

const TabBar = ({ theme, activeCategory, onPress }) => {
  return categoryKeys.map(c => {
    const category = Categories[c];
    if (c !== 'all')
      return (
        <ButtonPressAnimation
          activeOpacity={1}
          duration={100}
          enableHapticFeedback
          key={category.name}
          onPress={() => onPress(category)}
          scaleTo={0.75}
          style={{
            alignItems: 'center',
            /*backgroundColor: category === activeCategory ? colors.alpha(colors.blueGreyDark, 0.05) : null,
            borderRadius: 12,*/
            flex: 1,
            height: 30,
            justifyContent: 'center',
            maxWidth: 30,
          }}
        >
          {category === activeCategory && (
            <RadialGradient
              borderRadius={14}
              center={[32, 16]}
              colors={['#FFB114', '#FF54BB', '#00F0FF']}
              left={-1}
              opacity={0.1}
              overflow="hidden"
              position="absolute"
              radius={32}
              style={{ height: 32, width: 32 }}
              stops={[0, 0.635483871, 1]}
              top={-1}
            />
          )}
          <Icon
            name={category.icon}
            color={
              category === activeCategory
                ? null
                : colors.alpha(colors.blueGreyDark, 0.4)
            }
          />
        </ButtonPressAnimation>
      );
  });
};

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

const storage_key = '@react-native-emoji-selector:HISTORY';
export default class EmojiSelector extends PureComponent {
  state = {
    searchQuery: '',
    category: Categories.people,
    isReady: false,
    history: [],
    emojiList: null,
    colSize: 0,
  };

  //
  //  HANDLER METHODS
  //
  handleTabSelect = category => {
    if (this.state.isReady) {
      if (this.scrollview) {
        if (category == this.state.category) {
          this.scrollview.scrollToOffset({ animated: true, x: 0, y: 0 });
        } else {
          this.scrollview.scrollToOffset({ animated: false, x: 0, y: 0 });
        }
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

  //
  //  RENDER METHODS
  //
  renderEmojiCell = ({ item }) => (
    <EmojiCell
      key={item.key}
      emoji={item.emoji}
      onPress={() => this.handleEmojiSelect(item.emoji)}
      colSize={this.state.colSize}
      colNumber={this.props.columns}
    />
  );

  renderListHeader = () => {
    const title =
      this.state.searchQuery !== ''
        ? 'Search Results'
        : this.state.category.name;
    return (
      this.props.showSectionTitles && (
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeader}>{title}</Text>
        </View>
      )
    );
  };

  returnSectionData() {
    const { history, emojiList, searchQuery, category } = this.state;
    if (category === Categories.all && searchQuery === '') {
      //TODO: OPTIMIZE THIS
      let largeList = [];
      categoryKeys.forEach(c => {
        const name = Categories[c].name;
        const list =
          name === Categories.history.name ? history : emojiList[name];
        if (c !== 'all' && c !== 'history') largeList = largeList.concat(list);
      });

      return largeList.map(emoji => ({ key: emoji.unified, emoji }));
    } else {
      let list;
      const hasSearchQuery = searchQuery !== '';
      const name = category.name;
      if (hasSearchQuery) {
        const filtered = emoji.filter(e => {
          let display = false;
          e.short_names.forEach(name => {
            if (name.includes(searchQuery.toLowerCase())) display = true;
          });
          return display;
        });
        list = sortEmoji(filtered);
      } else {
        list = emojiList[name];
      }
      return list.map(emoji => ({ key: emoji.unified, emoji }));
    }
  }

  prerenderEmojis(cb) {
    let emojiList = {};
    categoryKeys.forEach(c => {
      let name = Categories[c].name;
      emojiList[name] = sortEmoji(emojiByCategory(name));
    });

    this.setState(
      {
        emojiList,
        colSize: width / this.props.columns,
      },
      cb
    );
  }

  //
  //  LIFECYCLE METHODS
  //
  componentDidMount() {
    const { category, showHistory } = this.props;
    this.setState({ category });

    if (showHistory) {
      this.loadHistoryAsync();
    }

    this.prerenderEmojis(() => {
      this.setState({ isReady: true });
    });
  }

  handleLayout = ({
    nativeEvent: {
      layout: { width: layoutWidth },
    },
  }) => {
    this.setState({ colSize: layoutWidth / this.props.columns });
  };

  render() {
    const {
      theme,
      columns,
      placeholder,
      showHistory,
      showSearchBar,
      showSectionTitles,
      showTabs,
      ...other
    } = this.props;

    const { category, colSize, isReady, searchQuery } = this.state;

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
      <View style={styles.frame} {...other} onLayout={this.handleLayout}>
        <View style={{ flex: 1 }}>
          {showSearchBar && Searchbar}
          {isReady ? (
            <View style={styles.container}>
              <FlatList
                columnWrapperStyle={styles.row}
                contentContainerStyle={{ paddingBottom: 75 }}
                data={this.returnSectionData()}
                horizontal={false}
                keyboardShouldPersistTaps="always"
                ListHeaderComponent={this.renderListHeader}
                numColumns={columns}
                ref={scrollview => (this.scrollview = scrollview)}
                renderItem={this.renderEmojiCell}
                scrollIndicatorInsets={{
                  top: 34,
                  left: 0,
                  right: 0,
                  bottom: 75,
                }}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
              />
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
    /*shadowColor: "#1F1D19",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,*/
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
  },
});
