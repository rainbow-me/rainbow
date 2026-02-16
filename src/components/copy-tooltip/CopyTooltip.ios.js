import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useRef } from 'react';
import ToolTip from 'react-native-tooltip';

function CopyTooltip({ textToCopy, tooltipText, ...props }) {
  const handleCopy = useCallback(() => Clipboard.setString(textToCopy), [textToCopy]);
  const { colors } = useTheme();
  const ref = useRef(undefined);
  useEffect(() => ref.current.hideMenu, []);
  return (
    <ToolTip
      {...props}
      actions={[{ onPress: handleCopy, text: tooltipText }]}
      onPress={() => ref.current.showMenu()}
      ref={ref}
      underlayColor={colors.transparent}
    />
  );
}

export default CopyTooltip;
