import React from 'react';

import { format } from 'date-fns';

import { Inset, Separator, Stack } from '@/design-system';
import { time } from '@/framework/core/utils/time';
import useDimensions from '@/hooks/useDimensions';
import timeUnits from '@/references/time-units.json';

import { useEnsRegistrationMetadataStore } from '../../data/stores/ownershipStores';
import { ENS_DOMAIN, REGISTRATION_MODES } from '../../utils/helpers';
import { RegistrationReviewRows } from './RegistrationReviewRows';

export const RenewContent = ({
  yearsDuration,
  registrationCostsData,
  setDuration,
  name,
}: {
  yearsDuration: number;
  registrationCostsData: any;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  name: string;
}) => {
  const { isSmallPhone } = useDimensions();

  const expiryDate = useEnsRegistrationMetadataStore(s => s.get(name + ENS_DOMAIN)?.expiryDate);
  const newExpiryDate = expiryDate ? format(time.seconds(Number(expiryDate) + yearsDuration * timeUnits.secs.year), 'MMM d, yyyy') : '—';

  return (
    <Inset vertical={isSmallPhone ? '12px' : '30px (Deprecated)'}>
      <Stack space={isSmallPhone ? '19px (Deprecated)' : '30px (Deprecated)'}>
        <Separator color="divider60 (Deprecated)" />
        <RegistrationReviewRows
          duration={yearsDuration}
          estimatedCostETH={registrationCostsData?.estimatedTotalRegistrationCost?.eth}
          maxDuration={99}
          mode={REGISTRATION_MODES.RENEW}
          networkFee={registrationCostsData?.estimatedNetworkFee?.display}
          newExpiryDate={newExpiryDate}
          onChangeDuration={setDuration}
          registrationFee={registrationCostsData?.estimatedRentPrice?.total?.display}
          totalCost={registrationCostsData?.estimatedTotalRegistrationCost?.display}
        />
        <Separator color="divider60 (Deprecated)" />
      </Stack>
    </Inset>
  );
};
