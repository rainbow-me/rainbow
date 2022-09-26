import * as React from 'react';
import { Box, Inset, Row, Rows } from '@/design-system';

export function Layout({
  children,
  header,
  footer,
}: {
  children: React.ReactNode;
  header: React.ReactElement;
  footer: React.ReactElement;
}) {
  return (
    <Inset top="60px" bottom="52px">
      <Box height="full">
        <Rows>
          <Row height="content">{header}</Row>
          <Row>
            <Rows alignHorizontal="center">
              <Row height="content">{children}</Row>
            </Rows>
          </Row>
          <Row height="content">{footer}</Row>
        </Rows>
      </Box>
    </Inset>
  );
}
