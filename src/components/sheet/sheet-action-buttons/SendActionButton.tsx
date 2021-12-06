import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SheetActionButton' was resolved to '/Use... Remove this comment to see the full error message
import SheetActionButton from './SheetActionButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

export default function SendActionButton({
  asset,
  color: givenColor,
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation();
  const handlePress = useCallback(
    () =>
      navigate(Routes.SEND_FLOW, (params: any) => {
        const updatedParams = { ...params, asset };
        return isNativeStackAvailable
          ? {
              params: updatedParams,
              screen: Routes.SEND_SHEET,
            }
          : { ...updatedParams };
      }),
    [navigate, asset]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SheetActionButton
      {...props}
      color={color}
      label="􀈠 Send"
      onPress={handlePress}
      testID="send"
      weight="heavy"
    />
  );
}
