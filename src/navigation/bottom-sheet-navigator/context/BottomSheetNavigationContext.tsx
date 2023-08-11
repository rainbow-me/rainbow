import React from 'react';

type BottomSheetNavigationContextType = {
  closeSheet: () => void;
};

const BottomSheetNavigationContext = React.createContext<
  BottomSheetNavigationContextType | undefined
>(undefined);

export { BottomSheetNavigationContext };
