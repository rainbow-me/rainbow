import React from 'react';
import RemoteSvg from '../svg/RemoteSvg';
import svgToPngIfNeeded from '@/handlers/svgs';

export function Media({ imageUrl }: { imageUrl: string }) {
  return (
    <RemoteSvg
      fallbackIfNonAnimated={!isENS || isCard}
      fallbackUri={svgToPngIfNeeded(imageUrl, true)}
      // lowResFallbackUri={item.lowResUrl}
      // onError={handleError}
      // resizeMode={resizeMode}
      // style={position.coverAsObject}
      uri={imageUrl}
    />
  );
}
