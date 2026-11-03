import React from 'react';

import { format } from 'date-fns';

import { Inset, Separator, Stack } from '@/design-system';
import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import { time } from '@/framework/core/utils/time';
import useDimensions from '@/hooks/useDimensions';
import timeUnits from '@/references/time-units.json';

import { useEnsSearchStore } from '../../data/stores/searchStore';
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

  const registration = useEnsSearchStore(s => s.get({ name, duration: yearsDuration * timeUnits.secs.year, renew: true }));
  const expiryDate = registration?.valid ? registration.expirationDate : undefined;
  const newExpiryDate = expiryDate ? format(time.seconds(Number(expiryDate) + yearsDuration * timeUnits.secs.year), 'MMM d, yyyy') : '—';

  return (
    <Inset vertical={isSmallPhone ? '12px' : '30px (Deprecated)'}>
      <Stack space={isSmallPhone ? '19px (Deprecated)' : '30px (Deprecated)'}>
        <Separator color="divider60 (Deprecated)" />
        <RegistrationReviewRows
          duration={yearsDuration}
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
