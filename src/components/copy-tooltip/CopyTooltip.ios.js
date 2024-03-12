import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useRef } from 'react';
import ToolTip from 'react-native-tooltip';

function CopyTooltip({ textToCopy, activeOpacity, tooltipText, ...props }) {
  const handleCopy = useCallback(() => Clipboard.setString(textToCopy), [textToCopy]);
  const { colors } = useTheme();
  const ref = useRef();
  useEffect(() => ref.current.hideMenu, []);
  return (
    <ToolTip
      {...props}
      actions={[{ onPress: handleCopy, text: tooltipText }]}
      activeOpacity={activeOpacity}
      onPress={() => ref.current.showMenu()}
      ref={ref}
      underlayColor={colors.transparent}
    />
  );
}

export default CopyTooltip;
