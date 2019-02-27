import PropTypes from 'prop-types';
import React from 'react';
import { isIphoneX } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import { withNeverRerender } from '../../hoc';
import { colors, padding } from '../../styles';

const Container = styled(Column)`
  background-color: ${colors.white};
  padding-bottom: ${isIphoneX() ? 50 : 20};
`;

const PasteButton = styled(Button).attrs({ type: 'pill' })`
  ${padding(0, 10)};
  background-color: ${colors.sendScreen.brightBlue};
  height: 30px;
`;

const SendEmptyState = ({ onPressPaste }) => (
  <Container flex={1} justify="space-between">
    <Centered flex={1} opacity={0.06}>
      <Icon
        color={colors.blueGreyDark}
        name="send"
        style={{ height: 88, width: 91 }}
      />
    </Centered>
    <Row css={padding(0, 15, 20)} justify="end" width="100%">
      <PasteButton onPress={onPressPaste}>Paste</PasteButton>
    </Row>
  </Container>
);

SendEmptyState.propTypes = {
  onPressPaste: PropTypes.func,
};

export default withNeverRerender(SendEmptyState);
