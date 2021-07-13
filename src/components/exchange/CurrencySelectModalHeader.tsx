import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
import { delayNext } from '@rainbow-me/hooks/useMagicAutofocus';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { borders, padding } from '@rainbow-me/styles';

const BackButtonWrapper = styled(Centered)`
  bottom: 0;
  left: 0;
  position: absolute;
  top: 3;
`;

export const CurrencySelectModalHeaderHeight = 59;
const HeaderContainer = styled(Centered)`
  ${borders.buildRadius('top', 12)};
  background-color: ${({ theme: { colors } }) => colors.white};
  height: ${CurrencySelectModalHeaderHeight};
  width: 100%;
`;

const Title = styled(TruncatedText).attrs({
  align: 'center',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
})`
  ${padding(1, 0, 0)};
  height: 21;
`;

export default function CurrencySelectModalHeader({ testID }) {
  const { navigate, dangerouslyGetState } = useNavigation();
  const {
    params: { setPointerEvents, title },
  } = useRoute();

  const handlePressBack = useCallback(() => {
    dangerouslyGetState().index = 1;
    setPointerEvents(false);
    delayNext();
    navigate(Routes.MAIN_EXCHANGE_SCREEN);
  }, [dangerouslyGetState, navigate, setPointerEvents]);

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
