import { format } from 'date-fns';
import React from 'react';
import { RegistrationReviewRows } from '../../../components/ens-registration';
import { Divider, Inset, Stack } from '@/design-system';
import { ENS_DOMAIN, REGISTRATION_MODES } from '@/helpers/ens';
import { useDimensions, useENSRegistrant } from '@/hooks';
import { timeUnits } from '@/references';

const RenewContent = ({
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

  const { data: { registration } = {} } = useENSRegistrant(name + ENS_DOMAIN);
  const expiryDate = registration?.expiryDate || 0;

  const newExpiryDateFormatted = format(
    new Date(
      Number(expiryDate * 1000) + yearsDuration * timeUnits.secs.year * 1000
    ),
    'MMM d, yyyy'
  );

  return (
    <Inset vertical={isSmallPhone ? '12px' : '30px'}>
      <Stack space={isSmallPhone ? '19px' : '30px'}>
        <Divider color="divider60" />
        <RegistrationReviewRows
          duration={yearsDuration}
          estimatedCostETH={
            registrationCostsData?.estimatedTotalRegistrationCost?.eth
          }
          maxDuration={99}
          mode={REGISTRATION_MODES.RENEW}
          networkFee={registrationCostsData?.estimatedNetworkFee?.display}
          newExpiryDate={newExpiryDateFormatted}
          onChangeDuration={setDuration}
          registrationFee={
            registrationCostsData?.estimatedRentPrice?.total?.display
          }
          totalCost={
            registrationCostsData?.estimatedTotalRegistrationCost?.display
          }
        />
        <Divider color="divider60" />
      </Stack>
    </Inset>
  );
};

export default RenewContent;
