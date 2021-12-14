import React from 'react';

import { Heading, Stack } from '../../system';
import { sprinkles } from '../../system/sprinkles.css';
import { Docs, DocsExample } from '../../types';
import { CodePreview } from '../CodePreview';

export const DocsAccordion = ({
  name: componentName,
  description,
  examples,
}: Docs) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Stack space="16px">
      <button
        className={sprinkles({
          backgroundColor: 'docs',
          marginLeft: '-32px',
          paddingVertical: '8px',
          position: 'sticky',
          top: 'none',
          zIndex: 1,
        })}
        onClick={() => setOpen(open => !open)}
        type="button"
      >
        <div
          className={sprinkles({
            color: 'action',
            display: 'flex',
            fontWeight: 'heavy',
          })}
          style={{ fontSize: '23px' }}
        >
          <div style={{ width: '32px' }}>{open ? '-' : '+'}</div>{' '}
          {componentName}
        </div>
      </button>
      {open && (
        <div className={sprinkles({ paddingBottom: '24px' })}>
          <Stack space="48px">
            {description && <Stack space="32px">{description}</Stack>}
            {examples?.map(
              (
                {
                  name,
                  description,
                  enablePlayroom,
                  enableCodeSnippet,
                  showFrame,
                  Example,
                },
                index
              ) => (
                <ExamplePreview
                  Example={Example}
                  description={description}
                  enableCodeSnippet={enableCodeSnippet}
                  enablePlayroom={enablePlayroom}
                  key={index}
                  name={name}
                  showFrame={showFrame}
                />
              )
            )}
          </Stack>
        </div>
      )}
    </Stack>
  );
};

////////////////////////////////////////////////////////////////////////////////

const ExamplePreview = ({
  name,
  description,
  enableCodeSnippet = true,
  showFrame = false,
  enablePlayroom = true,
  Example,
}: DocsExample) => {
  return (
    <Stack space="24px">
      <Heading color="secondary" weight="bold">
        {name}
      </Heading>
      {description && (
        <div className={sprinkles({ paddingBottom: '8px' })}>
          <Stack space="32px">{description}</Stack>
        </div>
      )}
      {Example && (
        <CodePreview
          Example={Example}
          enableCodeSnippet={enableCodeSnippet}
          enablePlayroom={enablePlayroom}
          showFrame={showFrame}
        />
      )}
    </Stack>
  );
};
