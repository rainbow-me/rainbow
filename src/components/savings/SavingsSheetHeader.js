import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components/primitives';
import { borders, colors, padding } from '../../styles';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { Rounded, Text } from '../text';

const SavingsSheetHeader = ({ balance, lifetimeAccruedInterest }) => {
  const balanceParts = balance.split('.');

  return (
    <Centered css={padding(9, 0, 3)} direction="column">
      <Rounded
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        letterSpacing="tooLoose"
        size="smedium"
        uppercase
        weight="semibold"
      >
        Savings
      </Rounded>
      <RowWithMargins margin={1}>
        <Rounded letterSpacing={0.2} size="h1" weight="heavy">
          {balanceParts[0]}
        </Rounded>
        <Rounded
          color={colors.dark}
          letterSpacing={0.1}
          size="large"
          style={{ top: 7 }}
          weight="heavy"
        >
          {`.${balanceParts[1]}`}
        </Rounded>
      </RowWithMargins>
      <RowWithMargins align="center" margin={5} marginTop={1}>
        <Icon name="plusCircled" />
        <Rounded
          color={colors.limeGreen}
          letterSpacing="looser"
          size="large"
          lineHeight="loose"
          weight="bold"
        >
          {lifetimeAccruedInterest}
        </Rounded>
      </RowWithMargins>
    </Centered>
  );
};

SavingsSheetHeader.propTypes = {
  balance: PropTypes.string,
  lifetimeAccruedInterest: PropTypes.string,
};

export default SavingsSheetHeader;
