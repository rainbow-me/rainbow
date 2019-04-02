import PropTypes from 'prop-types';
import React from 'react';
import { PasteAddressButton } from '../buttons';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import { withNeverRerender } from '../../hoc';
import transitionConfig from '../../navigation/transitions';
import { colors, padding } from '../../styles';

const SendEmptyState = ({ onPressPaste }) => (
  <Column
    css={`
      background-color: ${colors.white};
      padding-bottom: ${transitionConfig.sheetVerticalOffset + 19};
    `}
    flex={1}
    justify="space-between"
  >
    <Centered flex={1} opacity={0.06}>
      <Icon
        color={colors.blueGreyDark}
        name="send"
        style={{ height: 88, width: 91 }}
      />
    </Centered>
    <Row css={padding(0, 15)} justify="end" width="100%">
      <PasteAddressButton onPress={onPressPaste}/>
    </Row>
  </Column>
);

SendEmptyState.propTypes = {
  onPressPaste: PropTypes.func.isRequired,
};

export default withNeverRerender(SendEmptyState);
