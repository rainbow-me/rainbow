import React, { useContext, useImperativeHandle } from 'react';
import {
  Animated as RNAnimated,
  ScrollViewProps,
  ViewStyle,
} from 'react-native';
import BaseScrollView, {
  ScrollViewDefaultProps,
} from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import { useMemoOne } from 'use-memo-one';
import { useRecyclerAssetListPosition } from './Contexts';
import { StickyHeaderContext } from './StickyHeaders';

const extraPadding = { paddingBottom: 144 };
const ExternalScrollViewWithRef = React.forwardRef<
  BaseScrollView,
  ScrollViewDefaultProps & { contentContainerStyle: ViewStyle }
>(function ExternalScrollView(
  props: ScrollViewDefaultProps & { contentContainerStyle: ViewStyle },
  ref
) {
  const y = useRecyclerAssetListPosition()!;

  const { onScroll, ...rest } = props;
  const { scrollViewRef } = useContext(StickyHeaderContext)!;

  const event = useMemoOne(
    () =>
      RNAnimated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                y,
              },
            },
          },
        ],
        { listener: onScroll, useNativeDriver: true }
      ),
    [onScroll, y]
  );

  useImperativeHandle(ref, () => ({
    scrollTo: (value) => {
      console.log("XXX", y.setValue, value.y)
    //  y.setValue(value.y)
      scrollViewRef.current?.scrollTo(value);
    },
    scrollToOffset: (value) => {
      console.log("XXX", value)
      scrollViewRef.current?.scrollToOffset(value);
    },
    ...scrollViewRef.current,
  }));

  return (
    <RNAnimated.ScrollView
      {...(rest as ScrollViewProps)}
      contentContainerStyle={[extraPadding, rest.contentContainerStyle]}
      onScroll={event}
      ref={scrollViewRef}
    />
  );
});
export default ExternalScrollViewWithRef;
