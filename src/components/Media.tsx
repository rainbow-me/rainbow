import React, { useState } from 'react';
import { maybeSignUri } from '@/handlers/imgix';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
// @ts-ignore
import Video from 'react-native-video';
import SvgImage from './svg/SvgImage';

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
  style?: {
    width: number;
    height: number;
    borderRadius: number;
  };
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
          poster={signedFallbackUrl}
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
        <View style={StyleSheet.flatten([style, { overflow: 'hidden' }])}>
          <SvgImage fallbackUri={signedFallbackUrl} onLayout={onLayout} onError={onError} style={style} source={{ uri: signedUrl }} />
        </View>
      );
    case MimeType.GIF:
    case MimeType.PNG:
    case MimeType.JPG:
    default:
      return <FastImage onLayout={onLayout} onError={onError} resizeMode="cover" style={style} source={{ uri: signedUrl }} />;
  }
}
