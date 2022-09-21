import React from 'react';
import SvgImage from './SvgImage';
import { useSafeImageUri } from '@/hooks';

const RemoteSvg = props => {
  const safeUri = useSafeImageUri(props.uri, true);
  return <SvgImage {...props} source={{ uri: safeUri }} />;
};

export default RemoteSvg;
