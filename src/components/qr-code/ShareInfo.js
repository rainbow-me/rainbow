import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import styled from 'styled-components/primitives';
import { useClipboard } from '../../hooks';
import { colors, fonts } from '../../styles';
import { haptics } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Column } from '../layout';
import { Text, TruncatedAddress } from '../text';

const AddressText = styled(TruncatedAddress).attrs({
  color: colors.alpha(colors.white, 0.6),
})`
  font-size: 18px;
  letter-spacing: null;
  line-height: 19;
  text-align: center;
  width: 100%;
`;

const AddressWrapper = styled.View`
  height: 24px;
  margin-top: 5px;
`;

const ShareInfo = ({ accountAddress, accountName }) => {
  const { setClipboard } = useClipboard();

  return (
    <Column>
      <Text
        color="white"
        size={fonts.size.bigger}
        letterSpacing={0.5}
        weight="bold"
        align="center"
      >
        {accountName}
      </Text>
      <AddressWrapper>
        <FloatingEmojis
          distance={250}
          duration={500}
          fadeOut={false}
          flex={1}
          scaleTo={0}
          size={50}
          wiggleFactor={0}
        >
          {({ onNewEmoji }) => (
            <ButtonPressAnimation>
              <AddressText
                address={accountAddress}
                firstSectionLength={10}
                size="smaller"
                truncationLength={4}
                weight="medium"
                onPress={() => {
                  haptics.impactLight();
                  onNewEmoji();
                  setClipboard(accountAddress);
                }}
              />
            </ButtonPressAnimation>
          )}
        </FloatingEmojis>
      </AddressWrapper>
    </Column>
  );
};

ShareInfo.propTypes = {
  accountAddress: PropTypes.string,
  accountName: PropTypes.string,
};

export default onlyUpdateForPropTypes(ShareInfo);
