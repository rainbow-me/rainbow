import React from 'react';
import SvgImage from './SvgImage';
import { useSafeImageUri } from '@rainbow-me/hooks';

const RemoteSvg = props => {
  const safeUri = useSafeImageUri(props.uri);
  return <SvgImage {...props} source={{ uri: safeUri }} />;
};

export default RemoteSvg;
