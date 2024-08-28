import React, { useCallback, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  measure,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { globalColors } from '@/design-system';

import { useTheme } from '@/theme';

import { useDimensions } from '@/hooks';
import { FadeGradient } from '@/components/FadeGradient';

const COLLAPSED_CARD_HEIGHT = 56;
const MAX_CARD_HEIGHT = 176;

const CARD_BORDER_WIDTH = 1.5;

const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.2, 0, 0, 1),
};

type FadedScrollCardProps = {
  cardHeight: SharedValue<number>;
  children: React.ReactNode;
  contentHeight: SharedValue<number>;
  expandedCardBottomInset?: number;
  expandedCardTopInset?: number;
  initialScrollEnabled?: boolean;
  isExpanded: boolean;
  onPressCollapsedCard?: () => void;
  skipCollapsedState?: boolean;
};

export const FadedScrollCard = ({
  cardHeight,
  children,
  contentHeight,
  expandedCardBottomInset = 120,
  expandedCardTopInset = 120,
  initialScrollEnabled,
  isExpanded,
  onPressCollapsedCard,
  skipCollapsedState,
}: FadedScrollCardProps) => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { isDarkMode } = useTheme();

  const cardRef = useAnimatedRef<Animated.View>();

  const [scrollEnabled, setScrollEnabled] = useState(initialScrollEnabled);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);

  const yPosition = useSharedValue(0);

  const maxExpandedHeight = deviceHeight - (expandedCardBottomInset + expandedCardTopInset);

  const containerStyle = useAnimatedStyle(() => {
    return {
      height:
        cardHeight.value > MAX_CARD_HEIGHT || !skipCollapsedState
          ? interpolate(
              cardHeight.value,
              [MAX_CARD_HEIGHT, MAX_CARD_HEIGHT, maxExpandedHeight],
              [cardHeight.value, MAX_CARD_HEIGHT, MAX_CARD_HEIGHT],
              'clamp'
            )
          : undefined,
      zIndex: interpolate(cardHeight.value, [0, MAX_CARD_HEIGHT, MAX_CARD_HEIGHT + 1], [1, 1, 2], 'clamp'),
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const canExpandFully = contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
    return {
      opacity: canExpandFully && isFullyExpanded ? withTiming(1, timingConfig) : withTiming(0, timingConfig),
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const canExpandFully = contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
    const expandedCardHeight = Math.min(contentHeight.value + CARD_BORDER_WIDTH * 2, maxExpandedHeight);

    const outputRange = [0, 0];

    const yPos = -yPosition.value;
    const offset =
      deviceHeight - (expandedCardBottomInset + expandedCardTopInset) - expandedCardHeight - (yPosition.value + expandedCardHeight);

    if (yPos + expandedCardTopInset + offset >= deviceHeight - expandedCardBottomInset) {
      outputRange.push(0);
    } else {
      outputRange.push(deviceHeight - expandedCardBottomInset - yPosition.value - expandedCardHeight);
    }

    return {
      borderColor: interpolateColor(
        cardHeight.value,
        [0, MAX_CARD_HEIGHT, expandedCardHeight],
        isDarkMode ? ['#1F2023', '#1F2023', '#242527'] : ['#F5F7F8', '#F5F7F8', '#FBFCFD']
      ),
      height: cardHeight.value > MAX_CARD_HEIGHT ? cardHeight.value : undefined,
      position: canExpandFully && isFullyExpanded ? 'absolute' : 'relative',
      transform: [
        {
          translateY: interpolate(cardHeight.value, [0, MAX_CARD_HEIGHT, expandedCardHeight], outputRange),
        },
      ],
    };
  });

  const centerVerticallyWhenCollapsedStyle = useAnimatedStyle(() => {
    return {
      transform: skipCollapsedState
        ? undefined
        : [
            {
              translateY: interpolate(
                cardHeight.value,
                [
                  0,
                  COLLAPSED_CARD_HEIGHT,
                  contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
                    ? MAX_CARD_HEIGHT
                    : contentHeight.value + CARD_BORDER_WIDTH * 2,
                  maxExpandedHeight,
                ],
                [-2, -2, 0, 0]
              ),
            },
          ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const canExpandFully = contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
    return {
      shadowOpacity: canExpandFully && isFullyExpanded ? withTiming(isDarkMode ? 0.9 : 0.16, timingConfig) : withTiming(0, timingConfig),
    };
  });

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentHeight.value = Math.round(height);
    },
    [contentHeight]
  );

  const handleOnLayout = useCallback(() => {
    runOnUI(() => {
      if (cardHeight.value === MAX_CARD_HEIGHT) {
        const measurement = measure(cardRef);
        if (measurement === null) {
          return;
        }
        if (yPosition.value !== measurement.pageY) {
          yPosition.value = measurement.pageY;
        }
      }
    })();
  }, [cardHeight, cardRef, yPosition]);

  useAnimatedReaction(
    () => ({ contentHeight: contentHeight.value, isExpanded, isFullyExpanded }),
    ({ contentHeight, isExpanded, isFullyExpanded }, previous) => {
      if (
        isFullyExpanded !== previous?.isFullyExpanded ||
        isExpanded !== previous?.isExpanded ||
        contentHeight !== previous?.contentHeight
      ) {
        if (isFullyExpanded) {
          const expandedCardHeight =
            contentHeight + CARD_BORDER_WIDTH * 2 > maxExpandedHeight ? maxExpandedHeight : contentHeight + CARD_BORDER_WIDTH * 2;
          if (contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT && cardHeight.value >= MAX_CARD_HEIGHT) {
            cardHeight.value = withTiming(expandedCardHeight, timingConfig);
          } else {
            runOnJS(setIsFullyExpanded)(false);
          }
        } else if (isExpanded) {
          cardHeight.value = withTiming(
            contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : contentHeight + CARD_BORDER_WIDTH * 2,
            timingConfig
          );
        } else {
          cardHeight.value = withTiming(COLLAPSED_CARD_HEIGHT, timingConfig);
        }

        const enableScroll = isExpanded && contentHeight + CARD_BORDER_WIDTH * 2 > (isFullyExpanded ? maxExpandedHeight : MAX_CARD_HEIGHT);
        runOnJS(setScrollEnabled)(enableScroll);
      }
    }
  );

  return (
    <Animated.View style={[{ maxHeight: MAX_CARD_HEIGHT }, containerStyle]}>
      <Animated.View
        onTouchEnd={() => {
          if (isFullyExpanded) {
            setIsFullyExpanded(false);
          }
        }}
        pointerEvents={isFullyExpanded ? 'auto' : 'none'}
        style={[
          {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            height: deviceHeight * 3,
            left: -deviceWidth * 0.5,
            position: 'absolute',
            top: -deviceHeight,
            width: deviceWidth * 2,
            zIndex: -1,
          },
          backdropStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            shadowColor: globalColors.grey100,
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowRadius: 15,
          },
          shadowStyle,
        ]}
      >
        <Animated.View
          onTouchStart={handleOnLayout}
          ref={cardRef}
          style={[
            {
              backgroundColor: isDarkMode ? globalColors.white10 : '#FBFCFD',
              borderCurve: 'continuous',
              borderRadius: 28,
              borderWidth: CARD_BORDER_WIDTH,
              overflow: 'hidden',
              width: '100%',
            },
            cardStyle,
          ]}
        >
          <Animated.ScrollView
            onContentSizeChange={handleContentSizeChange}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
          >
            <TouchableWithoutFeedback
              onPress={
                !isExpanded
                  ? onPressCollapsedCard
                  : () => {
                      if (!isFullyExpanded) {
                        setIsFullyExpanded(true);
                      } else setIsFullyExpanded(false);
                    }
              }
            >
              <Animated.View style={[centerVerticallyWhenCollapsedStyle, { padding: 24 - CARD_BORDER_WIDTH }]}>{children}</Animated.View>
            </TouchableWithoutFeedback>
          </Animated.ScrollView>
          <FadeGradient side="top" />
          <FadeGradient side="bottom" />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
