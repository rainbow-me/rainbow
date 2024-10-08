import React from 'react';

const alwaysTrue = () => true;

export default function neverRerender<T>(Component: React.ComponentType<T>) {
  return React.memo(Component, alwaysTrue);
}
