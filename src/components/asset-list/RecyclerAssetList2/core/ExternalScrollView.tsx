import React, { useContext, useImperativeHandle } from 'react';
import { Animated as RNAnimated, ScrollViewProps, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BaseScrollView, { ScrollViewDefaultProps } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import { useMemoOne } from 'use-memo-one';
import { useRecyclerAssetListPosition } from './Contexts';
import { StickyHeaderContext } from './StickyHeaders';
import { safeAreaInsetValues } from '@/utils';
import { IS_ANDROID } from '@/env';

const extraPadding = { paddingBottom: 100 + safeAreaInsetValues.bottom };
const ExternalScrollViewWithRef = React.forwardRef<BaseScrollView, ScrollViewDefaultProps & { contentContainerStyle: ViewStyle }>(
  function ExternalScrollView(props: ScrollViewDefaultProps & { contentContainerStyle: ViewStyle }, ref) {
    const y = useRecyclerAssetListPosition()!;
    const insets = useSafeAreaInsets();

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

    useImperativeHandle(ref, () => scrollViewRef.current!);

    return (
      <RNAnimated.ScrollView
        {...(rest as ScrollViewProps)}
        contentContainerStyle={[extraPadding, rest.contentContainerStyle, { paddingTop: IS_ANDROID ? insets.top - 24 : insets.top }]}
        onScroll={event}
        // @ts-expect-error possibly undefined
        ref={scrollViewRef}
      />
    );
  }
);
export default ExternalScrollViewWithRef;
