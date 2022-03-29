import { sources } from '@rainbow-me/swaps';
import lang from 'i18n-js';
import { capitalize } from 'lodash';
import React from 'react';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { logger } from '@rainbow-me/utils';

export default function SwapDetailsUniswapRow(props) {
  const { protocols } = props;
  logger.debug(protocols);

  if (protocols?.length > 1) {
    return (
      <SwapDetailsRow label="Swapping via:" truncated={false}>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{`\n\n`}
        {protocols.map(({ name, part }) => (
          <SwapDetailsValue key={`${name}_${part}`}>
            {capitalize(sources[name]) || 'Other'} {Number(part).toFixed(2)}%{' '}
            {`\n`}
          </SwapDetailsValue>
        ))}
      </SwapDetailsRow>
    );
  } else if (protocols?.length > 0) {
    return (
      <SwapDetailsRow label={lang.t('expanded_state.swap.swapping_via')}>
        <SwapDetailsValue>
          {capitalize(sources[protocols[0].name]) || 'Other'}
        </SwapDetailsValue>
      </SwapDetailsRow>
    );
  }
  return null;
}
