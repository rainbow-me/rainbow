import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import {
  State as GestureHandlerState,
  ScrollView,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { DataProvider, LayoutProvider, ProgressiveListView } from 'recyclerlistview';
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
import getEmojiCellsProperties from './helpers/getEmojiCellProperties';
import getFormattedAllEmojiList, { AllEmojiContentEntry, AllEmojiEntry, AllEmojiHeaderEntry } from './helpers/getFormattedAllEmojiList';
import { EmojiCategory, EmojiEntry } from './types';
import { useTheme } from '@/theme';

const { width } = Dimensions.get('screen');

const categoryKeys = Object.keys(Categories);

const EMOJI_CONTAINER = 1;
const HEADER_ROW = 2;
const OVERLAY = 3;

type Props = {
  /** Function called when a user selects an Emoji */
  onEmojiSelected: (emojiCode: string) => void;
  /** Toggle the tabs on or off */
  showTabs?: boolean;
  /** Toggle section title on or off */
  showSectionTitles?: boolean;
  /** Number of columns across */
  columns: number;
};

export const EmojiSelector = ({ columns = 7, showSectionTitles = true, showTabs = ios, onEmojiSelected, ...other }: Props) => {
  const { colors } = useTheme();
  const [allEmojiList, setAllEmojiList] = useState<AllEmojiEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [category, setCategory] = useState(Categories.people);
  const scrollPosition = useSharedValue(0);
  const nextCategoryOffset = useSharedValue(1);

  const recyclerListView = useRef<ScrollView>(null);
  const currentIndex = useRef(0);
  const blockCategories = useRef(true);

  const { cellSize, fontSize } = getEmojiCellsProperties(columns);

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
            dim.height = Math.floor(entry.data.length / columns + 1) * cellSize;
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
    [allEmojiList, cellSize, columns]
  );

  useEffect(() => {
    nextCategoryOffset.value = 1;

    loadEmojis();
    setTimeout(() => {
      setIsReady(true);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmojis = () => {
    const allEmojiList = getFormattedAllEmojiList(categoryKeys, columns);

    setAllEmojiList(allEmojiList);
  };

  const onTapChange = ({ nativeEvent: { state } }: TapGestureHandlerStateChangeEvent) => {
    if (state === GestureHandlerState.BEGAN) {
      blockCategories.current = false;
    }
  };

  const handleTabSelect = (category: EmojiCategory) => {
    blockCategories.current = true;

    const nextSection = allEmojiList[(currentIndex.current + 1) * 2] as AllEmojiContentEntry;

    const offsetY = category.index * 2 - 1 > 0 ? (allEmojiList[category.index * 2] as AllEmojiContentEntry).offset ?? 0 : 0;

    scrollToOffset(offsetY, true);
    currentIndex.current = category.index;
    setCategory(category);

    nextCategoryOffset.value = -offsetY + (nextSection.offset ?? 0) < 550 || offsetY < 1 ? 1 : 0;
  };

  const scrollToOffset = (position: number, animated?: boolean) => {
    recyclerListView.current?.scrollTo(position, 0, animated);
  };

  const handleEmojiSelect = useCallback(
    (emoji: EmojiEntry) => {
      onEmojiSelected(charFromEmojiObject(emoji));
    },
    [onEmojiSelected]
  );

  const hasRowChanged = () => {
    return false;
  };

  const handleScroll = (event: ScrollEvent, offsetX: number, offsetY: number) => {
    if (ios && !blockCategories.current) {
      const nextSection = allEmojiList[(currentIndex.current + 1) * 2] as AllEmojiContentEntry;

      const currentSection = allEmojiList[currentIndex.current * 2] as AllEmojiContentEntry;

      if (offsetY - 0.5 > (nextSection.offset ?? 0) && currentIndex.current < allEmojiList.length / 2 - 2) {
        currentIndex.current += 1;
        setCategory(Categories[categoryKeys[currentIndex.current]]);
      } else if (currentIndex.current * 2 - 1 > 0 && offsetY - 0.5 < (currentSection.offset ?? 0)) {
        currentIndex.current -= 1;
        setCategory(Categories[categoryKeys[currentIndex.current]]);
      }
      scrollPosition.value = -offsetY + (nextSection.offset ?? 0) > 40 ? 1 : (-offsetY + (nextSection.offset ?? 0)) / 40;
      nextCategoryOffset.value = -offsetY + (nextSection.offset ?? 0) < 550 || offsetY < 1 ? 1 : 0;
    }
  };

  const renderStickyItem = useCallback(
    (type: string | number | undefined, item: AllEmojiHeaderEntry, index: number) => {
      return <EmojisStickyListItem headerData={item} index={index} scrollPosition={scrollPosition} />;
    },
    [scrollPosition]
  );

  const renderScrollView = useCallback(
    ({ children, ...props }: PropsWithChildren) => {
      const emojiRows: string[][] = [];

      if (allEmojiList[2]) {
        for (let i = 0; i < columns * 10; i += columns) {
          const emojis = [];
          for (let j = 0; j < columns; j++) {
            emojis.push(charFromEmojiObject((allEmojiList[2] as AllEmojiContentEntry).data[i + j].emoji));
          }
          emojiRows.push(emojis);
        }
      }

      return (
        <ScrollView {...props} ref={recyclerListView}>
          {isReady ? children : <InitialEmojis cellSize={cellSize} emojisRows={emojiRows} fontSize={fontSize} />}
        </ScrollView>
      );
    },
    [allEmojiList, cellSize, columns, fontSize, isReady]
  );

  const renderItem = useCallback(
    (type: number, item: AllEmojiEntry, index: number) => {
      if (type === HEADER_ROW) {
        const title = (item as AllEmojiHeaderEntry).title;
        return <EmojisListHeader nextCategoryOffset={nextCategoryOffset} showSectionTitles={showSectionTitles} title={title} />;
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
          cellSize={cellSize}
          columns={columns}
          fontSize={fontSize}
          onEmojiSelect={handleEmojiSelect}
        />
      );
    },
    [cellSize, columns, fontSize, handleEmojiSelect, nextCategoryOffset, showSectionTitles, colors.white]
  );

  return (
    <View style={sx.frame} {...other}>
      {/* @ts-expect-error Property 'children' does not exist on type */}
      <TapGestureHandler onHandlerStateChange={onTapChange}>
        <View style={sx.outerContainer}>
          {!isReady ? <EmojisLoader /> : null}
          <View style={sx.container}>
            <StickyContainer overrideRowRenderer={renderStickyItem} stickyHeaderIndices={[1, 3, 5, 7, 9, 11, 13, 15, 17]}>
              {/* @ts-expect-error */}
              <ProgressiveListView
                canChangeSize={false}
                dataProvider={new DataProvider(hasRowChanged).cloneWithRows(allEmojiList)}
                // @ts-expect-error
                externalScrollView={renderScrollView}
                layoutProvider={layoutProvider}
                onScroll={handleScroll}
                renderAheadOffset={300}
                renderAheadStep={100}
                // @ts-expect-error
                rowRenderer={renderItem}
                scrollIndicatorInsets={[15, 0, 15, 0]}
                style={sx.listStyle}
              />
            </StickyContainer>
          </View>
        </View>
      </TapGestureHandler>
      {showTabs ? <TabsWithShadows category={category} onTabSelect={handleTabSelect} /> : null}
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
  frame: {
    flex: 1,
  },
  header: { height: 400, position: 'absolute', width },
  listStyle: {
    width,
  },
  outerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
