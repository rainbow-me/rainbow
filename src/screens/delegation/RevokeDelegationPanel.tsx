import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { RevokeDelegationContextProvider } from './context/RevokeDelegationContext';
import { RevokeDelegationFlow } from './components/RevokeDelegationFlow';
import { RevokeReason } from './types';

export { RevokeReason } from './types';
export type { RevokeStatus } from './types';

export const RevokeDelegationPanel = () => {
  const { params: { delegationsToRevoke = [], onSuccess, revokeReason = RevokeReason.ALERT_UNSPECIFIED } = {} } =
    useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  return (
    <RevokeDelegationContextProvider delegationsToRevoke={delegationsToRevoke} onSuccess={onSuccess} revokeReason={revokeReason}>
      <RevokeDelegationFlow />
    </RevokeDelegationContextProvider>
  );
};
