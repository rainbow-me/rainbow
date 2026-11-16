import React, { useCallback, useEffect, useRef } from 'react';

import Clipboard from '@react-native-clipboard/clipboard';
import ToolTip from 'react-native-tooltip';

import { useTheme } from '@/theme/ThemeContext';

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
