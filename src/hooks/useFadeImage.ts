import { useCallback, useEffect, useState } from 'react';
import { Source } from 'react-native-fast-image';
import { Easing, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ImgixImage } from '@/components/images';

export default function useFadeImage({ source, enabled = true }: { source?: Source; enabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  const opacity = useSharedValue(1);

  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, {
        duration: 100,
        easing: Easing.linear,
      }),
    };
  });

  useEffect(() => {
    if (enabled && !source) {
      setIsLoading(false);
    }
  }, [enabled, source]);

  const onLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  useAnimatedReaction(
    () => ({ enabled, isLoading }),
    ({ isLoading, enabled }) => {
      opacity.value = isLoading || !enabled ? 0 : 1;
    },
    [isLoading, enabled]
  );

  return { isLoading, onLoadEnd, style };
}
