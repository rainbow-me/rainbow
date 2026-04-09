import React from 'react';

import useSafeImageUri from '@/hooks/useSafeImageUri';

import SvgImage from './SvgImage';

const RemoteSvg = props => {
  const safeUri = useSafeImageUri(props.uri, true);
  return <SvgImage {...props} source={{ uri: safeUri }} />;
};

export default RemoteSvg;
