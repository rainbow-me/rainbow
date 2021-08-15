/* eslint-disable no-unused-vars */
import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Linking, StatusBar } from 'react-native';
import NfcManager, {
  MifareIOS as Ndef,
  NfcEvents,
  NfcTech,
} from 'react-native-nfc-manager';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useDimensions } from '@rainbow-me/hooks';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';

export const NFCSheetHeight = android ? 454 : 434;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const Gradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  steps: [0, 0.5, 1],
  weight: 'heavy',
})``;

const NFCSheet = () => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const insets = useSafeArea();
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const [text, setText] = useState();
  const [payload, setPayload] = useState();

  useEffect(() => {
    NfcManager.start();
  });

  const readData = async () => {
    try {
      let tech = ios ? NfcTech.MifareIOS : NfcTech.NfcA;
      let resp = await NfcManager.requestTechnology(tech, {
        alertMessage: 'Ready to do some custom Mifare cmd!',
      });

      let cmd = NfcManager.transceive;

      resp = await cmd([0x3a, 4, 4]);
      let payloadLength = parseInt(resp.toString().split(',')[1]);
      let payloadPages = Math.ceil(payloadLength / 4);
      let startPage = 5;
      let endPage = startPage + payloadPages - 1;

      resp = await cmd([0x3a, startPage, endPage]);
      let bytes = resp.toString().split(',');
      let text = '';

      for (let i = 0; i < bytes.length; i++) {
        if (i < 5) {
          continue;
        }

        if (parseInt(bytes[i]) === 254) {
          break;
        }

        text = text + String.fromCharCode(parseInt(bytes[i]));
      }

      setText(text);

      NfcManager.cancelTechnologyRequest().catch(() => 0);
    } catch (ex) {
      setText(ex.toString());
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    }
  };

  const writeData = async () => {
    let result = false;
    try {
      await NfcManager.requestTechnology(NfcTech.MifareIOS, {
        alertMessage: 'Ready to write some NDEF',
      });
      const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
      if (bytes) {
        await NfcManager.ndefHandler // Step2
          .writeNdefMessage(bytes); // Step3

        if (ios) {
          await NfcManager.setAlertMessageIOS('Successfully write NDEF');
        }
      }
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    } catch (ex) {
      setText(ex.toString());
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    }
  };

  const sheetHeight = NFCSheetHeight;

  const handleClose = useCallback(() => {
    NfcManager.cancelTechnologyRequest().catch(() => 0);
    goBack();
  }, [goBack]);

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <Centered
          direction="column"
          height={sheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          <ColumnWithMargins
            margin={15}
            style={{
              height: sheetHeight,
              padding: 19,
              width: '100%',
            }}
          >
            <Emoji
              align="center"
              size="h1"
              style={{ ...fontWithWidth(fonts.weight.bold) }}
            >
              🍳
            </Emoji>

            <Gradient align="center" lineHeight="big" size="big" weight="heavy">
              Scan Me
            </Gradient>
            {text && <Text>{text}</Text>}
            <SheetActionButton
              androidWidth={deviceWidth - 60}
              color={colors.alpha(colors.appleBlue, 0.04)}
              isTransparent
              label="Write NFC"
              onPress={() => writeData()}
              size="big"
              textColor={colors.appleBlue}
              weight="heavy"
            />
            <SheetActionButton
              androidWidth={deviceWidth - 60}
              color={colors.alpha(colors.appleBlue, 0.04)}
              isTransparent
              label="Got it"
              onPress={handleClose}
              size="big"
              textColor={colors.appleBlue}
              weight="heavy"
            />
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(NFCSheet);
