import React from 'react';
import SvgImage from './SvgImage';
import { useSafeImageUri } from '@rainbow-me/hooks';

const RemoteSvg = props => {
  const isSVG = props.uri.endsWith('.svg');
  const safeUri = useSafeImageUri(props.uri, true);
  return <SvgImage {...props} source={{ uri: isSVG ? safeUri : props.uri }} />;
};

export default RemoteSvg;
