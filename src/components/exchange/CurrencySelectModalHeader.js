import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import { delayNext } from '../../hooks/useMagicAutofocus';
import { useNavigation } from '../../navigation/Navigation';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
import Routes from '@rainbow-me/routes';
import { borders, colors, padding } from '@rainbow-me/styles';

const BackButtonWrapper = styled(Centered)`
  bottom: 0;
  left: 0;
  position: absolute;
  top: 3;
`;

export const CurrencySelectModalHeaderHeight = 59;
const HeaderContainer = styled(Centered)`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: ${CurrencySelectModalHeaderHeight};
  width: 100%;
`;

const Title = styled(TruncatedText).attrs({
  align: 'center',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})`
  ${padding(1, 0, 0)};
  height: 21;
`;

export default function CurrencySelectModalHeader() {
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const title = params?.headerTitle;

  const { toggleGestureEnabled, isTransitionHappening } = params;

  const handlePressBack = useCallback(() => {
    if (isTransitionHappening.current) {
      return;
    }
    isTransitionHappening.current = true;
    delayNext();
    toggleGestureEnabled(true);
    navigate(Routes.MAIN_EXCHANGE_SCREEN);
  }, [isTransitionHappening, navigate, toggleGestureEnabled]);

  return (
    <HeaderContainer>
      <BackButtonWrapper>
        <BackButton
          direction="left"
          height={CurrencySelectModalHeaderHeight}
          onPress={handlePressBack}
        />
      </BackButtonWrapper>
      <Title>{title}</Title>
    </HeaderContainer>
  );
}
