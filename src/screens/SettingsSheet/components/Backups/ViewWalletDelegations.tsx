import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { Box } from '@/design-system';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';

type ViewWalletDelegationsParams = {
  ViewWalletDelegations: { walletId: string; address: string; title: string };
};

const ViewWalletDelegations = () => {
  const { params } = useRoute<RouteProp<ViewWalletDelegationsParams, typeof Routes.VIEW_WALLET_DELEGATIONS>>();
  const { address } = params;

  return (
    <MenuContainer>
      <Box>
        <Menu></Menu>
      </Box>
    </MenuContainer>
  );
};

export default ViewWalletDelegations;
