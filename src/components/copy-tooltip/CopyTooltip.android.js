import Clipboard from '@react-native-clipboard/clipboard';
import PropTypes from 'prop-types';
import React, { Fragment, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Tooltips from 'react-native-tooltips';

const CopyTooltip = ({ children, textToCopy, tooltipText }) => {
  const [visible, setVisible] = useState(false);
  const parent = useRef();
  const target = useRef();
  const { colors } = useTheme();

  return (
    <Fragment>
      <View ref={parent}>
        <TouchableOpacity
          onPress={() => {
            Clipboard.setString(textToCopy);
            setVisible(true);

            setTimeout(() => {
              setVisible(false);
            }, 1500);
          }}
          ref={target}
        >
          {children}
        </TouchableOpacity>
      </View>
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
