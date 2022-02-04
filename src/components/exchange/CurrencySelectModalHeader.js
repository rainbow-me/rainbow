import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
import { delayNext } from '@rainbow-me/hooks/useMagicAutofocus';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { borders, padding } from '@rainbow-me/styles';

const BackButtonWrapper = styled(Centered)({
  bottom: 0,
  left: 0,
  position: 'absolute',
  top: 3,
});

export const CurrencySelectModalHeaderHeight = 59;
const HeaderContainer = styled(Centered)({
  ...borders.buildRadiusAsObject('top', 12),
  backgroundColor: ({ theme: { colors } }) => colors.white,
  height: CurrencySelectModalHeaderHeight,
  width: '100%',
});

const Title = styled(TruncatedText).attrs({
  align: 'center',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
})({
  ...padding.object(1, 0, 0),
  height: 21,
});

export default function CurrencySelectModalHeader({ setSearchQuery, testID }) {
  const { navigate, dangerouslyGetState } = useNavigation();
  const {
    params: { setPointerEvents, title },
  } = useRoute();

  const handlePressBack = useCallback(() => {
    dangerouslyGetState().index = 1;
    setPointerEvents(false);
    delayNext();
    setSearchQuery('');
    navigate(Routes.MAIN_EXCHANGE_SCREEN);
  }, [dangerouslyGetState, navigate, setPointerEvents, setSearchQuery]);

  return (
    <HeaderContainer>
      <BackButtonWrapper>
        <BackButton
          direction="left"
          height={CurrencySelectModalHeaderHeight}
          onPress={handlePressBack}
          testID={testID}
          textChevron={android}
          throttle
        />
      </BackButtonWrapper>
      <Title>{title}</Title>
    </HeaderContainer>
  );
}
