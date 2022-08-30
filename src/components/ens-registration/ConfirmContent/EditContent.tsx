import lang from 'i18n-js';
import React from 'react';
import { Switch } from 'react-native-gesture-handler';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Divider, Inline, Inset, Row, Rows, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';

const EditContent = ({
  accentColor,
  sendReverseRecord,
  setSendReverseRecord,
  showReverseRecordSwitch,
}: {
  accentColor: any;
  sendReverseRecord: boolean;
  setSendReverseRecord: React.Dispatch<React.SetStateAction<boolean>> | null;
  showReverseRecordSwitch?: boolean;
}) => {
  const { navigate } = useNavigation();
  const openPrimaryENSNameHelper = () => {
    navigate(Routes.EXPLAIN_SHEET, { type: 'ens_primary_name' });
  };

  if (!showReverseRecordSwitch)
    return (
      <Rows alignVertical="bottom">
        <Row height="content">
          <Divider />
        </Row>
      </Rows>
    );
  return (
    <Rows alignVertical="bottom">
      <Row height="content">
        <Divider />
        <Inset top="19px">
          <Inline alignHorizontal="justify" alignVertical="center">
            <Inline>
              <Text color="secondary80" size="16px" weight="bold">
                {`${lang.t('profiles.confirm.set_ens_name')} `}
              </Text>
              <ButtonPressAnimation
                onPress={openPrimaryENSNameHelper}
                scaleTo={0.9}
              >
                <Text color="secondary30" size="16px" weight="bold">
                  􀅵
                </Text>
              </ButtonPressAnimation>
            </Inline>
            <Switch
              disabled={!setSendReverseRecord}
              onValueChange={() =>
                setSendReverseRecord?.(sendReverseRecord => !sendReverseRecord)
              }
              testID="ens-reverse-record-switch"
              thumbColor={colors.white}
              trackColor={{
                false: android ? colors.lightGrey : colors.white,
                true: accentColor,
              }}
              value={sendReverseRecord}
            />
          </Inline>
        </Inset>
      </Row>
    </Rows>
  );
};

export default EditContent;
