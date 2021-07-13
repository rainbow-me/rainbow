import React from 'react';
import { Text } from 'react-primitives';

const unicodeValue = '\xa0';
const Nbsp = props => <Text {...props}>{unicodeValue}</Text>;
Nbsp.unicode = unicodeValue;
export default Nbsp;
