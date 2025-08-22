import React, { memo } from 'react';
import { RainbowImage, RainbowImageProps } from '@/components/RainbowImage';
import { Box } from '@/design-system';

type HyperliquidTokenIconProps = Omit<RainbowImageProps, 'source'> & {
  symbol: string;
};

export const HyperliquidTokenIcon = memo(function HyperliquidTokenIcon({ symbol, ...props }: HyperliquidTokenIconProps) {
  // TODO (kane): testing
  return <Box width={40} height={40} borderRadius={20} background="accent" style={props.style} />;

  // return (
  //   <RainbowImage
  //     // eslint-disable-next-line react/jsx-props-no-spreading
  //     {...props}
  //   />
  // );
});
