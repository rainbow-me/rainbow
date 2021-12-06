import React, { useCallback } from 'react';
import styled from 'styled-components';
import Text from './Text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { buildTextStyles } from '@rainbow-me/styles';

const TextWithStyles = styled(Text)`
  ${buildTextStyles};
`;

const AnimatedNumberWithTextStyles = ({
  formatter,
  textAlign = 'right',
  disableTabularNums,
  initialValue,
  renderContent,
  style,
  value,
  ...props
}: any) => {
  const formatValue = useCallback(() => {
    const valueToFormat = value || initialValue;
    if (formatter) return formatter(valueToFormat);
    return () => Number(valueToFormat).toString();
  }, [formatter, value, initialValue]);

  const number = formatValue();
  const content = renderContent ? renderContent(number) : number;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TextWithStyles
      {...props}
      style={[
        {
          fontVariant: disableTabularNums ? undefined : ['tabular-nums'],
          textAlign,
        },
        style,
      ]}
    >
      {content}
    </TextWithStyles>
  );
};

export default AnimatedNumberWithTextStyles;
