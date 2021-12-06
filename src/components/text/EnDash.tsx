import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { Text } from 'react-primitives';

const unicodeValue = '\u2013';

// @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
const EnDash = (props: any) => <Text {...props}>{unicodeValue}</Text>;
EnDash.unicode = unicodeValue;
export default EnDash;
