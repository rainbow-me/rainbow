import React, { useState } from 'react';
import RemoteSvg from '../svg/RemoteSvg';
import svgToPngIfNeeded from '@/handlers/svgs';
import { ImgixImage } from '../images';
import { SimpleVideo } from '../video';
import { maybeSignUri } from '@/handlers/imgix';
import { Box, Cover, Text } from '@/design-system';
import { Image, View, ImageStyle, ViewStyle } from 'react-native';
import Video from 'react-native-video';
import SvgImage from '../svg/SvgImage';

export enum MimeType {
  MP4 = 'video/mp4',
  GIF = 'image/gif',
  PNG = 'image/png',
  SVG = 'image/svg+xml',
  JPG = 'image/jpeg',
}

export function Media({
  url,
  mimeType,
  fallbackUrl,
  style,
  size,
  onLayout,
  onError,
}: {
  url: string;
  mimeType?: string;
  fallbackUrl?: string;
  style?: ImageStyle;
  size?: number;
  onLayout?: () => void;
  onError?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const signedUrl = maybeSignUri(url, {
    // resizing breaks svg
    w: mimeType === MimeType.SVG ? undefined : size,
    fm: !mimeType ? 'png' : undefined,
  });
  const signedFallbackUrl = maybeSignUri(fallbackUrl ?? url, {
    w: size,
    fm: 'png',
  });

  switch (mimeType) {
    case MimeType.MP4:
      return (
        <Video
          onLayout={onLayout}
          loading={loading}
          onError={onError}
          muted
          resizeMode="cover"
          poster={fallbackUrl}
          posterResizeMode="cover"
          setLoading={setLoading}
          repeat
          style={style}
          source={{ uri: signedUrl }}
          uri={signedUrl}
        />
      );
    case MimeType.SVG:
      return (
        <SvgImage
          fallbackUri={signedFallbackUrl}
          onLayout={onLayout}
          onError={onError}
          style={style}
          source={{ uri: signedUrl }}
        />
      );
    case MimeType.GIF:
    case MimeType.PNG:
    case MimeType.JPG:
    default:
      return (
        <Image
          onLayout={onLayout}
          onError={onError}
          source={{ uri: signedUrl }}
          style={style}
        />
      );
  }
}