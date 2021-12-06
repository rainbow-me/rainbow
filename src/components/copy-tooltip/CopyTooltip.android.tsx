import Clipboard from '@react-native-community/clipboard';
import PropTypes from 'prop-types';
import React, { Fragment, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import Tooltips from 'react-native-tooltips';

const CopyTooltip = ({ children, textToCopy, tooltipText }: any) => {
  const [visible, setVisible] = useState(false);
  const parent = useRef();
  const target = useRef();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View ref={parent}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TouchableOpacity
          onPress={() => {
            Clipboard.setString(textToCopy);
            setVisible(true);

            setTimeout(() => {
              setVisible(false);
            }, 1500);
          }}
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          ref={target}
        >
          {children}
        </TouchableOpacity>
      </View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Tooltips
        corner={100}
        parent={parent.current}
        position={3}
        shadow={false}
        target={target.current}
        text={tooltipText}
        textColor={colors.white}
        textSize={14}
        tintColor={colors.blueGreyDark}
        visible={visible}
      />
    </Fragment>
  );
};

CopyTooltip.propTypes = {
  textToCopy: PropTypes.string,
  tooltipText: PropTypes.string,
};

export default CopyTooltip;
