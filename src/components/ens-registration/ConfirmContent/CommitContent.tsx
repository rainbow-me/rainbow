import lang from 'i18n-js';
import React from 'react';
import { Source } from 'react-native-fast-image';
import brain from '../../../assets/brain.png';
import { RegistrationReviewRows } from '../../../components/ens-registration';
import { Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { useDimensions } from '@/hooks';
import { ImgixImage } from '@/components/images';

const CommitContent = ({
  duration,
  registrationCostsData,
  setDuration,
}: {
  duration: number;
  registrationCostsData: any;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { isSmallPhone } = useDimensions();

  return (
    <Inset vertical={isSmallPhone ? 24 : 30}>
      <Stack space={isSmallPhone ? 19 : 30}>
        <Separator color="divider60 (Deprecated)" />
        <Inline
          alignHorizontal="center"
          alignVertical="center"
          space={6}
          wrap={false}
        >
          <Box>
            <ImgixImage
              source={brain as Source}
              style={{ height: 20, width: 20 }}
            />
          </Box>
          <Text
            align="center"
            color="secondary50 (Deprecated)"
            size="14px / 19px (Deprecated)"
            weight="bold"
          >
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
        <Separator color="divider60 (Deprecated)" />
      </Stack>
    </Inset>
  );
};

export default CommitContent;
