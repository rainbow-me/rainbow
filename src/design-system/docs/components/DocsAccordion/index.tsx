import React from 'react';
import { Inset } from '../../../components/Inset/Inset';

import { Heading, Stack } from '../../system';
import { sprinkles } from '../../system/sprinkles.css';
import { Docs, DocsExample } from '../../types';
import { CodePreview } from '../CodePreview';

export const DocsAccordion = ({ meta, description, examples }: Docs) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Stack space="16px">
      <button
        className={sprinkles({
          backgroundColor: 'body (Deprecated)',
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
            color: 'action (Deprecated)',
            display: 'flex',
            fontWeight: 'heavy',
          })}
          style={{ fontSize: '23px' }}
        >
          <div style={{ width: '32px' }}>{open ? '-' : '+'}</div> {meta.name}
        </div>
      </button>
      {open && (
        <div className={sprinkles({ paddingBottom: '24px' })}>
          <Stack space="48px">
            {description && <Stack space="32px">{description}</Stack>}
            {examples?.map(({ name, description, enablePlayroom, enableCodeSnippet, wrapper, showFrame, examples, Example }, index) => (
              <ExamplePreview
                Example={Example}
                description={description}
                enableCodeSnippet={enableCodeSnippet}
                enablePlayroom={enablePlayroom}
                examples={examples}
                key={index}
                name={name}
                showFrame={showFrame}
                wrapper={wrapper}
              />
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  );
};

////////////////////////////////////////////////////////////////////////////////

const ExamplePreview = ({
  name,
  subTitle,
  description,
  enableCodeSnippet = true,
  showFrame = false,
  enablePlayroom = true,
  wrapper,
  examples,
  Example,
}: DocsExample) => {
  return (
    <Stack space="24px">
      {subTitle ? (
        <Heading color="secondary60 (Deprecated)" size="20px / 22px (Deprecated)" weight="semibold">
          {subTitle}
        </Heading>
      ) : (
        <Heading color="secondary60 (Deprecated)" weight="bold">
          {name}
        </Heading>
      )}
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
          wrapper={wrapper}
        />
      )}
      {examples?.map((example, i) => (
        <Inset key={i} vertical="12px">
          <ExamplePreview {...example} />
        </Inset>
      ))}
    </Stack>
  );
};
