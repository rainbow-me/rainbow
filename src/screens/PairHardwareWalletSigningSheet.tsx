import * as i18n from '@/languages';
import React from 'react';
import { Linking } from 'react-native';
import {
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { SheetActionButton } from '@/components/sheet';
import { Layout } from '@/components/hardware-wallets/Layout';
import { useNavigation } from '@/navigation';
import { ButtonPressAnimation } from '@/components/animations';
import { TRANSLATIONS } from '@/navigation/PairHardwareWalletNavigator';
import { useDimensions } from '@/hooks';

const NUMBER_BOX_SIZE = 28;
const HORIZONTAL_INSET = 36;
const COLUMNS_PADDING = 20;

const NumberBox = ({ number }: { number: number }) => {
  const itemBorderColor = useForegroundColor('buttonStrokeSecondary');
  return (
    <Box
      width={NUMBER_BOX_SIZE}
      height={NUMBER_BOX_SIZE}
      alignItems="center"
      justifyContent="center"
      background="surfacePrimary"
      shadow="24px"
      borderRadius={8}
      style={{ borderWidth: 1, borderColor: itemBorderColor }}
    >
      <Text align="center" color="label" size="17pt" weight="bold">
        {number}
      </Text>
    </Box>
  );
};

type ItemDetails = {
  title: string;
  description: string;
};

type ItemProps = {
  item: ItemDetails;
  rank: number;
};

const Item = ({ item, rank }: ItemProps) => {
  const { width: deviceWidth } = useDimensions();
  return (
    <Columns space={COLUMNS_PADDING}>
      <Column width="content">
        <NumberBox number={rank} />
      </Column>
      <Column
        // sorry for this hack, but it's seemingly the only way to make the
        // text wrap properly while being confined to the horizontal inset
        width={deviceWidth - 2 * HORIZONTAL_INSET - COLUMNS_PADDING}
      >
        <Stack space={12}>
          <Text weight="heavy" size="17pt" color="label">
            {item.title}
          </Text>
          <Text weight="medium" size="15pt / 135%" color="labelSecondary">
            {item.description}
          </Text>
        </Stack>
      </Column>
    </Columns>
  );
};

export function PairHardwareWalletSigningSheet() {
  const buttonColor = useForegroundColor('purple');

  const items: ItemDetails[] = [
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_1.title),
      description: i18n.t(
        TRANSLATIONS.blind_signing_instructions.step_1.description
      ),
    },
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_2.title),
      description: i18n.t(
        TRANSLATIONS.blind_signing_instructions.step_2.description
      ),
    },
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_3.title),
      description: i18n.t(
        TRANSLATIONS.blind_signing_instructions.step_3.description
      ),
    },
  ];

  const { dangerouslyGetParent } = useNavigation();
  const { isSmallPhone } = useDimensions();
  return (
    <Layout
      header={
        <Inset horizontal={36}>
          <Stack alignHorizontal="center" space={20}>
            <Text align="center" color="label" weight="bold" size="26pt">
              {i18n.t(TRANSLATIONS.enable_blind_signing)}
            </Text>
            <Stack space={10}>
              <Text
                align="center"
                color="labelTertiary"
                weight="semibold"
                size="15pt / 135%"
              >
                {i18n.t(TRANSLATIONS.blind_signing_description)}
              </Text>
              <ButtonPressAnimation
                onPress={() =>
                  Linking.openURL(
                    'https://www.ledger.com/academy/enable-blind-signing-why-when-and-how-to-stay-safe'
                  )
                }
                scaleTo={0.9}
              >
                <Text
                  align="center"
                  color="blue"
                  weight="semibold"
                  size="15pt / 135%"
                >
                  {i18n.t(TRANSLATIONS.learn_more)}
                </Text>
              </ButtonPressAnimation>
            </Stack>
          </Stack>
        </Inset>
      }
      footer={
        <Inset horizontal={20}>
          <SheetActionButton
            color={buttonColor}
            label={i18n.t(TRANSLATIONS.blind_signing_enabled)}
            lightShadows
            onPress={() => dangerouslyGetParent()?.goBack()}
            size="big"
            weight="heavy"
          />
        </Inset>
      }
    >
      <Inset horizontal={HORIZONTAL_INSET} top={isSmallPhone ? 36 : 80}>
        <Stack space={isSmallPhone ? 36 : 44}>
          {items.map((item, index) => (
            <Item item={item} rank={index + 1} key={index} />
          ))}
        </Stack>
      </Inset>
    </Layout>
  );
}
