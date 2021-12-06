import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-native';
import Caret from '../../assets/family-dropdown-arrow.png';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const ListItemArrowGroup = ({ children }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins align="center" flex={1} justify="end" margin={7}>
      {typeof children === 'string' ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          size="large"
          weight="medium"
        >
          {children}
        </Text>
      ) : (
        children
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Image
        source={Caret}
        style={{
          height: 18,
          marginTop: 0.5,
          tintColor: colors.alpha(colors.blueGreyDark, 0.6),
          width: 8,
        }}
      />
    </RowWithMargins>
  );
};

ListItemArrowGroup.propTypes = {
  children: PropTypes.node,
};

export default React.memo(ListItemArrowGroup);
