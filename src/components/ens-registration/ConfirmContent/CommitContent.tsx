import lang from 'i18n-js';
import React from 'react';
import { Source } from 'react-native-fast-image';
import brain from '../../../assets/brain.png';
import { RegistrationReviewRows } from '../../../components/ens-registration';
import {
  Box,
  Divider,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { ImgixImage } from '@rainbow-me/images';

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
        <Inline
          alignHorizontal="center"
          alignVertical="center"
          space="6px"
          wrap={false}
        >
          <Box>
            <ImgixImage
              source={brain as Source}
              style={{ height: 20, width: 20 }}
            />
          </Box>
          <Text color="secondary50" size="14px" weight="heavy">
            {lang.t('profiles.confirm.suggestion')}
          </Text>
        </Inline>
        <RegistrationReviewRows
          duration={duration}
          estimatedCostETH={
            registrationCostsData?.estimatedTotalRegistrationCost?.eth
          }
          maxDuration={99}
          mode={REGISTRATION_MODES.CREATE}
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
