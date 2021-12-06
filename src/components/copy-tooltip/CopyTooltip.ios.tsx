import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useEffect, useRef } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import ToolTip from 'react-native-tooltip';

function CopyTooltip({
  textToCopy,
  activeOpacity,
  tooltipText,
  ...props
}: any) {
  const handleCopy = useCallback(() => Clipboard.setString(textToCopy), [
    textToCopy,
  ]);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const ref = useRef();
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  useEffect(() => ref.current.hideMenu, []);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ToolTip
      {...props}
      actions={[{ onPress: handleCopy, text: tooltipText }]}
      activeOpacity={activeOpacity}
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      onPress={() => ref.current.showMenu()}
      ref={ref}
      underlayColor={colors.transparent}
    />
  );
}

export default CopyTooltip;
