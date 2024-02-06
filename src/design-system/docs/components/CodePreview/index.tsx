import lzString from 'lz-string';
import React from 'react';

import { Box } from '../../../components/Box/Box';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import ChevronUpIcon from '../../icons/ChevronUpIcon';
import PlayIcon from '../../icons/PlayIcon';
import { Button, ButtonLink, CodeBlock, Inline, Stack } from '../../system';
import { sprinkles } from '../../system/sprinkles.css';
import { Example } from '../../types';
import { getSourceFromExample } from '../../utils/getSourceFromExample.web';
import { Source } from '../../utils/source.macro';

export const CodePreview = ({
  disableActions = false,
  enableCodeSnippet = true,
  enablePlayroom = true,
  wrapper = children => children,
  showCode: defaultShowCode = false,
  showFrame = false,
  Example,
}: {
  disableActions?: boolean;
  enableCodeSnippet?: boolean;
  showCode?: boolean;
  enablePlayroom?: boolean;
  showFrame?: boolean;
  wrapper?: Example['wrapper'];
  Example: () => Source<React.ReactChild>;
}) => {
  const [showCode, setShowCode] = React.useState(Boolean(defaultShowCode));
  const { displayCode, playroomCode, element } = React.useMemo(
    () =>
      getSourceFromExample({
        Example,
      }),
    [Example]
  );

  return (
    <Stack space="16px">
      <div
        className={sprinkles({
          backgroundColor: 'bodyTint (Deprecated)',
          borderRadius: '16px',
          padding: '24px',
        })}
      >
        <div
          className={sprinkles({
            borderRadius: '16px',
            ...(showFrame
              ? {
                  backgroundColor: 'body (Deprecated)',
                }
              : {}),
          })}
        >
          <Box>{wrapper(element)}</Box>
        </div>
      </div>
      {displayCode && (
        <>
          {showCode && <CodeBlock code={displayCode} />}
          {!disableActions && (
            <Inline space="24px">
              {enableCodeSnippet && (
                <Button
                  color="action (Deprecated)"
                  iconBefore={showCode ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  onClick={() => setShowCode(showCode => !showCode)}
                >
                  {showCode ? 'Hide' : 'Show'} code
                </Button>
              )}
              {enablePlayroom && (
                <ButtonLink
                  color="action (Deprecated)"
                  href={`${
                    process.env.NODE_ENV === 'production'
                      ? // @ts-ignore
                        `${window.location.href}playroom`
                      : 'http://localhost:9000/'
                  }?code=${lzString.compressToEncodedURIComponent(JSON.stringify({ code: playroomCode }))}`}
                  iconBefore={<PlayIcon />}
                >
                  Playroom
                </ButtonLink>
              )}
            </Inline>
          )}
        </>
      )}
    </Stack>
  );
};
