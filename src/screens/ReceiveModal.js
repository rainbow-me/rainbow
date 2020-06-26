import { toLower } from 'lodash';
import React from 'react';
import { Platform, Share } from 'react-native';
import { useSelector } from 'react-redux';
import styled from 'styled-components/primitives';
import QRCodeDisplay from '../components/QRCodeDisplay';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { Centered, Column } from '../components/layout';
import ShareButton from '../components/qr-code/ShareButton';
import ShareInfo from '../components/qr-code/ShareInfo';
import { useAccountProfile, useClipboard } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { colors } from '../styles';

const QRCodeSize = Platform.OS === 'ios' ? 250 : 190;

const TopHandle = styled.View`
  background-color: ${colors.white};
  border-radius: 2.5px;
  height: 5px;
  width: 36px;
`;

const QRwrapper = styled(Column)`
  box-shadow: 0px 10px 50px rgba(0, 0, 0, 0.6);
`;

const ReceiveModal = () => {
  const accountAddress = useSelector(({ settings: { accountAddress } }) =>
    toLower(accountAddress)
  );
  const { accountName } = useAccountProfile();
  const { goBack } = useNavigation();
  const { setClipboard } = useClipboard();

  return (
    <Centered flex={1} bottom={16}>
      <Column align="center">
        <TouchableBackdrop onPress={goBack} />
        <TopHandle />
        <QRwrapper
          align="center"
          backgroundColor={colors.white}
          borderRadius={39}
          margin={24}
          marginTop={19}
          padding={24}
        >
          <QRCodeDisplay size={QRCodeSize} value={accountAddress} />
        </QRwrapper>
        <ShareInfo
          accountAddress={accountAddress}
          accountName={accountName}
          onPress={() => setClipboard(accountAddress)}
        />
        <ShareButton
          onPress={() =>
            Share.share({
              message: accountAddress,
              title: 'My account address:',
            })
          }
        />
      </Column>
    </Centered>
  );
};

export default React.memo(ReceiveModal);
