import React from 'react';

const alwaysTrue = () => true;
export default function neverRerender(Component: any) {
  return React.memo(Component, alwaysTrue);
}
