import React from 'react';

const alwaysTrue = () => true;
export default function neverRerender(Component) {
  return React.memo(Component, alwaysTrue);
}
