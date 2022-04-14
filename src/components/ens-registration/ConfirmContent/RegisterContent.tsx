import lang from 'i18n-js';
import React from 'react';
import { Switch } from 'react-native-gesture-handler';
import {
  Box,
  Divider,
  Inline,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { colors } from '@rainbow-me/styles';

const RegisterContent = ({
  accentColor,
  sendReverseRecord,
  setSendReverseRecord,
}: {
  accentColor: any;
  sendReverseRecord: boolean;
  setSendReverseRecord: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Box flexGrow={1} paddingHorizontal="30px">
      <Rows>
        <Row>
          <Box flexGrow={1} justifyContent="center" paddingHorizontal="24px">
            <Stack space="24px">
              <Text
                align="center"
                color="primary"
                containsEmoji
                size="23px"
                weight="heavy"
              >
                {lang.t('profiles.confirm.last_step')} 💈
              </Text>
              <Text
                align="center"
                color="secondary60"
                size="16px"
                weight="semibold"
              >
                {lang.t('profiles.confirm.last_step_description')}
              </Text>
            </Stack>
          </Box>
        </Row>
        <Row height="content">
          <Stack space="19px">
            <Divider />
            <Inline alignHorizontal="justify" alignVertical="center">
              <Text color="secondary80" size="16px" weight="bold">
                {lang.t('profiles.confirm.set_ens_name')} 􀅵
              </Text>
              <Switch
                disabled={!setSendReverseRecord}
                onValueChange={() =>
                  setSendReverseRecord?.(
                    sendReverseRecord => !sendReverseRecord
                  )
                }
                testID="ens-reverse-record-switch"
                trackColor={{ false: colors.white, true: accentColor }}
                value={sendReverseRecord}
              />
            </Inline>
          </Stack>
        </Row>
      </Rows>
    </Box>
  );
};

export default RegisterContent;
