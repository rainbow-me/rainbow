import Clipboard from '@react-native-community/clipboard';
import PropTypes from 'prop-types';
import React, { Fragment, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Tooltips from 'react-native-tooltips';
import { colors } from '../../styles';

const CopyTooltip = ({ children, textToCopy, tooltipText }) => {
  const [visible, setVisible] = useState(false);
  const parent = useRef();
  const target = useRef();

  return (
    <Fragment>
      <View ref={parent}>
        <TouchableOpacity
          ref={target}
          onPress={() => {
            Clipboard.setString(textToCopy);
            setVisible(true);

            setTimeout(() => {
              setVisible(false);
            }, 1500);
          }}
        >
          {children}
        </TouchableOpacity>
      </View>
      <Tooltips
        text={tooltipText}
        visible={visible}
        parent={parent.current}
        target={target.current}
        shadow={false}
        textSize={14}
        textColor={colors.white}
        tintColor={colors.blueGreyDark}
        corner={100}
        position={3}
      />
    </Fragment>
  );
};

CopyTooltip.propTypes = {
  textToCopy: PropTypes.string,
  tooltipText: PropTypes.string,
};

export default CopyTooltip;
