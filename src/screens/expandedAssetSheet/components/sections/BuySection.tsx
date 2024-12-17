import React from 'react';
import { Bleed, Box, IconContainer, Inline, Stack, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ScrollView } from 'react-native-gesture-handler';
import { ButtonPressAnimation } from '@/components/animations';
import { Row } from '../shared/Row';

function BuyButton({ usdAmount }: { usdAmount: number }) {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <ButtonPressAnimation>
      <Box
        borderRadius={20}
        padding="12px"
        width={{ custom: 112 }}
        alignItems="center"
        justifyContent="center"
        style={{ backgroundColor: accentColors.opacity12, borderColor: accentColors.opacity6, borderWidth: 1.33 }}
      >
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text weight="heavy" size="17pt" color="accent">
            ${usdAmount}
          </Text>
        </TextShadow>
      </Box>
    </ButtonPressAnimation>
  );
}

export function BuySection() {
  // const [currency, setCurrency] = useState<Currency>(Currency.USD);

  // const menuConfig = useMemo<MenuConfig<MintsFilter>>(() => {
  //   return {
  //     menuItems: [
  //       {
  //         actionKey: MintsFilter.All,
  //         actionTitle: getMintsFilterLabel(MintsFilter.All),
  //         menuState: filter === MintsFilter.All ? 'on' : 'off',
  //       },
  //       {
  //         actionKey: MintsFilter.Free,
  //         actionTitle: getMintsFilterLabel(MintsFilter.Free),
  //         menuState: filter === MintsFilter.Free ? 'on' : 'off',
  //       },
  //       {
  //         actionKey: MintsFilter.Paid,
  //         actionTitle: getMintsFilterLabel(MintsFilter.Paid),
  //         menuState: filter === MintsFilter.Paid ? 'on' : 'off',
  //       },
  //     ],
  //   };
  // }, [filter]);

  // const onPressMenuItem = useCallback(
  //   (selection: MintsFilter) => {
  //     haptics.selection();
  //     setFilter(selection);
  //   },
  //   [setFilter]
  // );

  return (
    <Box gap={12}>
      <Stack space="4px">
        <Row highlighted>
          <Inline alignVertical="center" space="12px">
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="accent">
                  􁾫
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="accent">
                Pay with
              </Text>
            </TextShadow>
          </Inline>
        </Row>
        <Row>
          <Inline alignVertical="center" space="12px">
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="labelTertiary">
                  􀣽
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="labelTertiary">
                Available Balance
              </Text>
            </TextShadow>
          </Inline>
        </Row>
      </Stack>
      <Bleed horizontal="24px">
        <ScrollView horizontal contentContainerStyle={{ gap: 9, paddingHorizontal: 24 }} showsHorizontalScrollIndicator={false}>
          <BuyButton usdAmount={100} />
          <BuyButton usdAmount={500} />
          <BuyButton usdAmount={1000} />
          <BuyButton usdAmount={5000} />
        </ScrollView>
      </Bleed>
    </Box>
  );
}
