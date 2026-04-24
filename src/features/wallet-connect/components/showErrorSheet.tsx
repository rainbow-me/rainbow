import React from 'react';

import { Box } from '@/design-system';
import * as i18n from '@/languages';
import * as explain from '@/screens/Explain';

const T = i18n.l.walletconnect;

const BUTTON_HEIGHT = 52;
const TITLE_HEIGHT = 55;
const SPACING_HEIGHT = 18;
const SHEET_PADDING = 88;

/**
 * Navigates to `ExplainSheet` by way of `WalletConnectApprovalSheet`, and
 * shows the text configured by the `reason` string, which is a key of the
 * `explainers` object in `ExplainSheet`
 */
export function showErrorSheet({
  title,
  body,
  cta,
  onClose,
  sheetHeight,
}: {
  title: string;
  body: string;
  cta?: string;
  onClose?: () => void;
  sheetHeight: number;
}) {
  explain.open(
    () => (
      <Box paddingVertical="44px" paddingHorizontal="32px">
        <explain.Title>{title}</explain.Title>
        <explain.Body maxHeight={sheetHeight - BUTTON_HEIGHT - TITLE_HEIGHT - SPACING_HEIGHT - SHEET_PADDING}>{body}</explain.Body>
        <Box paddingTop="20px">
          <explain.Button
            label={cta || i18n.t(T.errors.go_back)}
            onPress={() => {
              explain.close();
              onClose?.();
            }}
          />
        </Box>
      </Box>
    ),
    { sheetHeight }
  );
}
