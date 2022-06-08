/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable react-native/no-unused-styles */
import React, {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import {
  State as GestureHandlerState,
  ScrollView,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { Value } from 'react-native-reanimated';
import {
  DataProvider,
  LayoutProvider,
  ProgressiveListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import 'string.fromcodepoint';
import { ScrollEvent } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import { deviceUtils } from '../../utils';
import { Categories } from './Categories';
import EmojiContent from './EmojiContent';
import EmojisListHeader from './EmojisListHeader';
import EmojisLoader from './EmojisLoader';
import EmojisStickyListItem from './EmojisStickyListItem';
import InitialEmojis from './InitialEmojis';
import TabsWithShadows from './TabsWithShadows';
import { charFromEmojiObject } from './helpers/charFromEmojiObject';
import getFormattedAllEmojiList, {
  AllEmojiContentEntry,
  AllEmojiEntry,
  AllEmojiHeaderEntry,
} from './helpers/getFormattedAllEmojiList';
import { EmojiCategory, EmojiEntry } from './types';
import { ThemeContextProps, useTheme } from '@rainbow-me/context';

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
  /** Toggle section title on or off */
  showSectionTitles?: boolean;
  /** Set the default category. Use the `Categories` class */
  category: EmojiCategory;
  /** Number of columns across */
  columns: number;
} & ThemeContextProps;

const EmojiSelector = ({
  columns = 7,
  showSectionTitles = true,
  showTabs = ios,
  onEmojiSelected,
  ...other
}: Props) => {
  const { colors } = useTheme();
  const [allEmojiList, setAllEmojiList] = useState<AllEmojiEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [category, setCategory] = useState(Categories.people);
  const [colSize, setColSize] = useState(0);

  const recyclerListView = useRef<ComponentType<any>>();

  const layoutProvider = useMemo(
    () =>
      new LayoutProvider(
        i => {
          if (i === 0 || i === allEmojiList.length - 1) {
            return OVERLAY;
          }
          if (i % 2 === 0) {
            return EMOJI_CONTAINER;
          }
          return HEADER_ROW;
        },
        (type, dim, i) => {
          if (type === EMOJI_CONTAINER) {
            const entry = allEmojiList[i] as AllEmojiContentEntry;
            dim.height =
              Math.floor(entry.data.length / 7 + 1) * ((width - 21) / columns);
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
      ),
    [allEmojiList, columns]
  );

  useEffect(() => {
    nextCategoryOffset = new Value(1);

    loadEmojis();
    setTimeout(() => {
      setIsReady(true);
    }, 300);
  }, []);

  const loadEmojis = () => {
    const allEmojiList = getFormattedAllEmojiList(categoryKeys, columns);

    setAllEmojiList(allEmojiList);
    setColSize(width / columns);
  };

  const onTapChange = ({
    nativeEvent: { state },
  }: TapGestureHandlerStateChangeEvent) => {
    if (state === GestureHandlerState.BEGAN) {
      blockCategories = false;
    }
  };

  const handleTabSelect = (category: EmojiCategory) => {
    blockCategories = true;
    scrollToOffset(
      category.index * 2 - 1 > 0
        ? (allEmojiList[category.index * 2] as AllEmojiContentEntry).offset ?? 0
        : 0,
      true
    );
    currentIndex = category.index;
    setCategory(category);
  };

  const scrollToOffset = (position: number, animated?: boolean) => {
    // @ts-expect-error
    recyclerListView.current?.scrollTo(position, 0, animated);
  };

  const handleEmojiSelect = (emoji: EmojiEntry) => {
    onEmojiSelected(charFromEmojiObject(emoji));
  };

  const hasRowChanged = () => {
    return false;
  };

  const handleScroll = (
    event: ScrollEvent,
    offsetX: number,
    offsetY: number
  ) => {
    if (!blockCategories) {
      if (
        // @ts-expect-error
        offsetY - 0.5 > allEmojiList[(currentIndex + 1) * 2].offset &&
        currentIndex < allEmojiList.length / 2 - 2
      ) {
        currentIndex += 1;
        setCategory(Categories[categoryKeys[currentIndex]]);
      } else if (
        currentIndex * 2 - 1 > 0 &&
        // @ts-expect-error
        offsetY - 0.5 < allEmojiList[currentIndex * 2].offset
      ) {
        currentIndex -= 1;
        setCategory(Categories[categoryKeys[currentIndex]]);
      }
      scrollPosition.setValue(
        // @ts-expect-error
        -offsetY + allEmojiList[(currentIndex + 1) * 2].offset > 40
          ? 1
          : // @ts-expect-error
            (-offsetY + allEmojiList[(currentIndex + 1) * 2].offset) / 40
      );
      nextCategoryOffset.setValue(
        // @ts-expect-error
        -offsetY + allEmojiList[(currentIndex + 1) * 2].offset < 400 ||
          offsetY < 1
          ? 1
          : 0
      );
    }
  };

  const renderStickyItem = useCallback(
    (
      type: string | number | undefined,
      item: AllEmojiHeaderEntry,
      index: number
    ) => {
      return (
        <EmojisStickyListItem
          headerData={item}
          index={index}
          scrollPosition={scrollPosition}
        />
      );
    },
    []
  );

  const renderScrollView = useCallback(
    ({ children, ...props }) => {
      const emojiRows: string[][] = [];

      if (allEmojiList[2]) {
        for (let i = 0; i < columns * 10; i += columns) {
          let emojis = [];
          for (let j = 0; j < columns; j++) {
            emojis.push(
              charFromEmojiObject(
                (allEmojiList[2] as AllEmojiContentEntry).data[i + j].emoji
              )
            );
          }
          emojiRows.push(emojis);
        }
      }

      return (
        <ScrollView {...props} ref={recyclerListView}>
          {isReady ? (
            children
          ) : (
            <InitialEmojis
              columnSize={colSize}
              columns={columns}
              emojisRows={emojiRows}
            />
          )}
        </ScrollView>
      );
    },
    [allEmojiList, colSize, columns, isReady]
  );

  const renderItem = useCallback(
    (type: number, item: AllEmojiEntry, index: number) => {
      if (type === HEADER_ROW) {
        const title = (item as AllEmojiHeaderEntry).title;
        return (
          <EmojisListHeader
            nextCategoryOffset={nextCategoryOffset}
            showSectionTitles={showSectionTitles}
            title={title}
          />
        );
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
      return (
        <EmojiContent
          {...(item as AllEmojiContentEntry)}
          columnSize={colSize}
          columns={columns}
          onEmojiSelect={handleEmojiSelect}
        />
      );
    },
    [colSize, columns, handleEmojiSelect, colors]
  );

  return (
    <View style={sx.frame} {...other}>
      <TapGestureHandler onHandlerStateChange={onTapChange}>
        <View style={sx.outerContainer}>
          {!isReady ? <EmojisLoader /> : null}
          <View style={sx.container}>
            <StickyContainer
              overrideRowRenderer={renderStickyItem}
              stickyHeaderIndices={[1, 3, 5, 7, 9, 11, 13, 15, 17]}
            >
              {/* @ts-expect-error */}
              <ProgressiveListView
                canChangeSize={false}
                dataProvider={new DataProvider(hasRowChanged).cloneWithRows(
                  allEmojiList
                )}
                // @ts-expect-error
                externalScrollView={renderScrollView}
                layoutProvider={layoutProvider}
                onScroll={handleScroll}
                renderAheadOffset={300}
                renderAheadStep={100}
                // @ts-expect-error
                rowRenderer={renderItem}
                scrollIndicatorInsets={[15, 0, 15, 0]}
                style={{ width: deviceUtils.dimensions.width }}
              />
            </StickyContainer>
          </View>
        </View>
      </TapGestureHandler>
      {showTabs ? (
        <TabsWithShadows category={category} onTabSelect={handleTabSelect} />
      ) : null}
    </View>
  );
};

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
    width: width,
  },
  outerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  header: { height: 400, position: 'absolute' },
  frame: {
    flex: 1,
  },
  row: {
    alignItems: 'center',
  },
  searchbar_container: {
    width: '100%',
    zIndex: 1,
  },
});

export default EmojiSelector;
