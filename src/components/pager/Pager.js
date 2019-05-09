import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native-gesture-handler';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { dimensionsPropType } from '../../utils';
import { FlexItem } from '../layout';
import PagerControls from './PagerControls';
import PagerItem, { pagerPagePropType } from './PagerItem';

const getItemLayout = (data, index) => {
  const { width } = data[index].dimensions;
  return {
    index,
    length: width,
    offset: width * index,
  };
};

const keyExtractor = ({ name }, index) => (`${name}_${index}`);

const renderItem = props => <PagerItem {...props} />;

const Pager = ({
  controlsProps,
  currentIndex,
  dimensions,
  onScroll,
  onScrollEndDrag,
  pages,
  scrollEnabled,
}) => (
  <FlexItem>
    <FlatList
      data={pages}
      getItemLayout={getItemLayout}
      horizontal
      initialScrollIndex={currentIndex}
      keyExtractor={keyExtractor}
      onScroll={onScroll}
      onScrollEndDrag={onScrollEndDrag}
      pagingEnabled
      renderItem={renderItem}
      scrollEnabled={scrollEnabled}
      scrollEventThrottle={32}
      showsHorizontalScrollIndicator={false}
    />
    {scrollEnabled && (
      <PagerControls
        {...controlsProps}
        length={pages.length}
        selectedIndex={currentIndex}
      />
    )}
  </FlexItem>
);

Pager.propTypes = {
  controlsProps: PropTypes.shape(PagerControls.propTypes),
  currentIndex: PropTypes.number,
  dimensions: dimensionsPropType,
  onScroll: PropTypes.func,
  onScrollEndDrag: PropTypes.func,
  pages: PropTypes.arrayOf(pagerPagePropType),
  scrollEnabled: PropTypes.bool,
};

export default compose(
  withState('currentIndex', 'setCurrentIndex', 0),
  mapProps(({ dimensions, pages, ...props }) => ({
    ...props,
    dimensions,
    pages: pages.map(page => ({
      ...page,
      dimensions,
    })),
  })),
  withProps(({ pages }) => ({
    scrollEnabled: pages.length > 1,
  })),
  withHandlers({
    onScroll: ({ currentIndex, dimensions, setCurrentIndex }) => ({ nativeEvent }) => {
      const currentOffsetX = get(nativeEvent, 'contentOffset.x', 0);

      const startOffsetX = currentIndex * dimensions.width;

      const endOffsetXLeft = (currentIndex - 1) * dimensions.width;
      const endOffsetXRight = (currentIndex + 1) * dimensions.width;

      const beginningOffset = currentOffsetX - startOffsetX;

      let newIndex = currentIndex;
      if (beginningOffset > (endOffsetXRight - startOffsetX) / 2) {
        newIndex = currentIndex + 1;
      } else if (beginningOffset < (endOffsetXLeft - startOffsetX) / 2) {
        newIndex = currentIndex - 1;
      }

      return setCurrentIndex(newIndex < 0 ? 0 : newIndex);
    },
    onScrollEndDrag: ({ dimensions, setCurrentIndex }) => ({ nativeEvent }) => {
      const currentOffsetX = get(nativeEvent, 'contentOffset.x', 0);
      const currentScreenIndex = Math.floor(currentOffsetX / dimensions.width);

      return setCurrentIndex(currentScreenIndex < 0 ? 0 : currentScreenIndex);
    },
  }),
  onlyUpdateForKeys(['currentIndex']),
)(Pager);
