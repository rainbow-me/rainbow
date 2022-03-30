import React from 'react';
import { RegistrationReviewRows } from '../../../components/ens-registration';
import { Divider, Inset, Stack } from '@rainbow-me/design-system';

const CommitContent = ({
  duration,
  registrationCostsData,
  setDuration,
}: {
  duration: number;
  registrationCostsData: any;
  setDuration: (duration: number) => void;
}) => {
  return (
    <Inset horizontal="30px">
      <Stack space="34px">
        <RegistrationReviewRows
          duration={duration}
          estimatedCostETH={
            registrationCostsData?.estimatedTotalRegistrationCost?.eth
          }
          maxDuration={99}
          networkFee={registrationCostsData?.estimatedNetworkFee?.display}
          onChangeDuration={setDuration}
          registrationFee={
            registrationCostsData?.estimatedRentPrice?.total?.display
          }
          totalCost={
            registrationCostsData?.estimatedTotalRegistrationCost?.display
          }
        />
        <Divider color="divider40" />
      </Stack>
    </Inset>
  );
};

export default CommitContent;
