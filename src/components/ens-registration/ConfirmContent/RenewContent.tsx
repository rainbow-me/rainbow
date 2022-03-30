import { format } from 'date-fns';
import React from 'react';
import { RegistrationReviewRows } from '../../../components/ens-registration';
import { Divider, Inset, Stack } from '@rainbow-me/design-system';
import { ENS_DOMAIN, REGISTRATION_STEPS } from '@rainbow-me/helpers/ens';
import { useENSProfile } from '@rainbow-me/hooks';
import { timeUnits } from '@rainbow-me/references';

const RenewContent = ({
  yearsDuration,
  registrationCostsData,
  setDuration,
  name,
}: {
  yearsDuration: number;
  registrationCostsData: any;
  setDuration: (duration: number) => void;
  name: string;
}) => {
  const ensProfile = useENSProfile(name + ENS_DOMAIN, { enabled: true });
  const expiryDate = ensProfile?.data?.registration?.expiryDate || 0;

  const newExpiryDateFormatted = format(
    new Date(
      Number(expiryDate * 1000) + yearsDuration * timeUnits.secs.year * 1000
    ),
    'MMM d, yyyy'
  );

  return (
    <Inset horizontal="30px">
      <Stack space="34px">
        <RegistrationReviewRows
          duration={yearsDuration}
          estimatedCostETH={
            registrationCostsData?.estimatedTotalRegistrationCost?.eth
          }
          maxDuration={99}
          networkFee={registrationCostsData?.estimatedNetworkFee?.display}
          newExpiryDate={newExpiryDateFormatted}
          onChangeDuration={setDuration}
          registrationFee={
            registrationCostsData?.estimatedRentPrice?.total?.display
          }
          step={REGISTRATION_STEPS.RENEW}
          totalCost={
            registrationCostsData?.estimatedTotalRegistrationCost?.display
          }
        />
        <Divider color="divider40" />
      </Stack>
    </Inset>
  );
};

export default RenewContent;
