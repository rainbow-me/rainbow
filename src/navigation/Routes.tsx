import React from 'react';
// eslint-disable-next-line import/no-unresolved
import OldRoutes from './OldRoutes';
import RouteNames from './routesNames';
import { createBottomSheetNavigator } from './bottom-sheet-navigator/createBottomSheetNavigator';
import ExplainSheet from '@/screens/ExplainSheet';
import ExpandedAssetSheet from '@/screens/ExpandedAssetSheet';
import SendSheet from '@/screens/SendSheet';

const BottomSheet = createBottomSheetNavigator();

export function Routes() {
  return (
    <BottomSheet.Navigator>
      <BottomSheet.Screen
        options={{ root: true }}
        component={OldRoutes}
        name={RouteNames.ROOT_STACK}
      />
      <BottomSheet.Screen
        component={ExpandedAssetSheet}
        name={RouteNames.EXPANDED_ASSET_SHEET}
      />
      <BottomSheet.Screen
        component={ExpandedAssetSheet}
        name={RouteNames.SWAP_DETAILS_SHEET}
      />
      <BottomSheet.Screen
        component={ExplainSheet}
        name={RouteNames.EXPLAIN_SHEET}
      />
      <BottomSheet.Screen
        component={SendSheet}
        name={RouteNames.SEND_SHEET_NAVIGATOR}
      />
    </BottomSheet.Navigator>
  );
}
