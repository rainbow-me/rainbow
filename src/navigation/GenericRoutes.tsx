import React from 'react';
import { createBottomSheetNavigator } from './bottom-sheet-navigator/createBottomSheetNavigator';
import ExpandedAssetSheet from '@/screens/ExpandedAssetSheet';
import Routes from './routesNames';
import { AddCashSheet } from '@/screens/AddCash';
import ChangeWalletSheet from '@/screens/ChangeWalletSheet';

const BottomSheet = createBottomSheetNavigator();

type Props = {
  mainComponent: React.ComponentType;
};

export function GenericRoutes({ mainComponent }: Props) {
  return (
    <BottomSheet.Navigator>
      <BottomSheet.Screen component={mainComponent} name="MAIN" />
      <BottomSheet.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
      />
      <BottomSheet.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SHEET}
      />
      <BottomSheet.Screen
        component={ChangeWalletSheet}
        name={Routes.CHANGE_WALLET_SHEET}
      />
    </BottomSheet.Navigator>
  );
}
