import { memo, useMemo } from 'react';
import { Image } from 'react-native';

import rnbwCoinImage from '@/assets/rnbw.png';

export const RnbwCoinIcon = memo(function RnbwCoinIcon({ size }: { size: number }) {
  const styles = useMemo(
    () => ({
      image: {
        width: size,
        height: size,
      },
    }),
    [size]
  );

  return <Image source={rnbwCoinImage} style={styles.image} />;
});
