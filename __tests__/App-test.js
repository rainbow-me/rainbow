/**
 * @format
 */

import 'react-native';
import React from 'react';
// eslint-disable-next-line import/extensions,import/no-unresolved
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
