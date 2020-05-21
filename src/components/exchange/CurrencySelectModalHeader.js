import React, { useCallback } from 'react';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import Routes from '../../screens/Routes/routesNames';
import { borders, colors, padding } from '../../styles';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';

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
  const title = useNavigationParam('headerTitle');

  const handlePressBack = useCallback(
    () => navigate(Routes.MAIN_EXCHANGE_SCREEN),
    [navigate]
  );

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
