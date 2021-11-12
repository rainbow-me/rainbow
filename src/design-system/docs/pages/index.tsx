import type { NextPage } from 'next';
import Head from 'next/head';
import React, { Children, Fragment, ReactNode } from 'react';
import {
  backgroundColors,
  foregroundColors,
  palettes,
} from '../../color/palettes';
import { fontWeights } from '../../typography/fontWeights';
import { typeHierarchy } from '../../typography/typeHierarchy';

type Space =
  | 'none'
  | '4px'
  | '8px'
  | '12px'
  | '16px'
  | '24px'
  | '32px'
  | '48px'
  | '64px';
const resolveSpace = (space: Space) => (space === 'none' ? undefined : space);

const HEADING_SIZE = 23;
const TEXT_SIZE = 18;

const GRID_SPACING: Space = '16px';
const CARD_GUTTER: Space = '32px';
const CARD_RADIUS = '16px';

const BODY_DARK = palettes.dark.backgroundColors.body.color;
const BODY_LIGHT = palettes.light.backgroundColors.body.color;
const PRIMARY_TEXT = palettes.light.foregroundColors.primary;
const SECONDARY_TEXT = palettes.light.foregroundColors.secondary60;
const SECONDARY_TEXT_DARK = palettes.dark.foregroundColors.secondary80;

const Title = ({ children }: { children: ReactNode }) => (
  <h1 style={{ color: PRIMARY_TEXT, fontSize: HEADING_SIZE, fontWeight: 800 }}>
    {children}
  </h1>
);

const Heading = ({ children }: { children: ReactNode }) => (
  <h2
    style={{ color: SECONDARY_TEXT, fontSize: HEADING_SIZE, fontWeight: 700 }}
  >
    {children}
  </h2>
);

const Stack = ({ space, children }: { space: Space; children: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: resolveSpace(space),
    }}
  >
    {children}
  </div>
);

const Columns = ({
  space,
  children,
}: {
  space: Space;
  children: ReactNode;
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      gap: resolveSpace(space),
      width: '100%',
    }}
  >
    {Children.map(children, child => (
      <div
        style={{
          flexBasis: 1,
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        {child}
      </div>
    ))}
  </div>
);

const Card = ({
  backgroundColor = 'white',
  height = 'auto',
  children,
}: {
  backgroundColor?: string;
  height?: 'full' | 'auto';
  children: ReactNode;
}) => (
  <div
    style={{
      backgroundColor,
      borderRadius: CARD_RADIUS,
      height: height === 'full' ? '100%' : height,
      padding: CARD_GUTTER,
      paddingBottom: CARD_GUTTER,
      paddingTop: CARD_GUTTER,
    }}
  >
    {children}
  </div>
);

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Rainbow Design System Cheat Sheet</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: 1020,
          paddingBottom: '48px',
          paddingLeft: GRID_SPACING,
          paddingRight: GRID_SPACING,
          paddingTop: '48px',
        }}
      >
        <Stack space="64px">
          <Stack space="24px">
            <Stack space="12px">
              <Title>Typography</Title>
              <Columns space={GRID_SPACING}>
                <Heading>Heading Sizes</Heading>
                <Heading>Text Sizes</Heading>
                <Heading>Font Weights</Heading>
              </Columns>
            </Stack>
            <Columns space={GRID_SPACING}>
              <Card height="full">
                <Stack space={CARD_GUTTER}>
                  {Object.entries(typeHierarchy.heading).map(
                    (
                      [sizeName, { fontSize, lineHeight, letterSpacing }],
                      index
                    ) => (
                      <div key={index} style={{ fontSize: fontSize }}>
                        <div style={{ color: PRIMARY_TEXT, fontWeight: 800 }}>
                          {sizeName} heading
                        </div>
                        <div
                          style={{
                            color: SECONDARY_TEXT,
                            fontWeight: 500,
                          }}
                        >
                          {lineHeight}
                          px line height
                          <br />
                          {letterSpacing}px spacing
                        </div>
                      </div>
                    )
                  )}
                </Stack>
              </Card>

              <Card height="full">
                <Stack space={CARD_GUTTER}>
                  {Object.entries(typeHierarchy.text).map(
                    (
                      [sizeName, { fontSize, lineHeight, letterSpacing }],
                      index
                    ) => (
                      <div key={index} style={{ fontSize: fontSize }}>
                        <div style={{ color: PRIMARY_TEXT, fontWeight: 800 }}>
                          {sizeName} text
                        </div>
                        <div
                          style={{
                            color: SECONDARY_TEXT,
                            fontWeight: 600,
                          }}
                        >
                          {lineHeight}
                          px line height
                          <br />
                          {letterSpacing}px spacing
                        </div>
                      </div>
                    )
                  )}
                </Stack>
              </Card>

              <Card height="full">
                <Stack space="12px">
                  {Object.entries(fontWeights).map(
                    ([fontWeightName, fontWeight], index) => (
                      <div
                        key={index}
                        style={{
                          color: PRIMARY_TEXT,
                          fontSize: TEXT_SIZE,
                          fontWeight: parseInt(fontWeight, 10),
                        }}
                      >
                        {fontWeightName} ({fontWeight})
                      </div>
                    )
                  )}
                </Stack>
              </Card>
            </Columns>
          </Stack>

          <Stack space="24px">
            <Stack space="12px">
              <Title>Background Colors</Title>
              <Columns space={GRID_SPACING}>
                <Heading>Light Mode</Heading>
                <Heading>Dark Mode</Heading>
              </Columns>
            </Stack>
            <Stack space={GRID_SPACING}>
              {Object.entries(backgroundColors).map(
                ([backgroundName, background], i) => (
                  <Columns key={i} space={GRID_SPACING}>
                    {('color' in background
                      ? [background, background]
                      : [background.light, background.dark]
                    ).map(({ color, mode }, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: color,
                          borderRadius: CARD_RADIUS,
                          color: mode === 'light' ? PRIMARY_TEXT : 'white',
                          padding: CARD_GUTTER,
                        }}
                      >
                        <Stack space="8px">
                          <div
                            style={{
                              fontSize: TEXT_SIZE,
                              fontWeight: 800,
                              wordBreak: 'break-word',
                            }}
                          >
                            {backgroundName}
                          </div>
                          <div
                            style={{
                              color:
                                mode === 'light'
                                  ? SECONDARY_TEXT
                                  : SECONDARY_TEXT_DARK,
                              fontSize: TEXT_SIZE,
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            }}
                          >
                            {color}
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Columns>
                )
              )}
            </Stack>
          </Stack>

          <Stack space="24px">
            <Stack space="12px">
              <Title>Foreground Colors</Title>
              <Columns space={GRID_SPACING}>
                <Heading>Light Mode</Heading>
                <Heading>Dark Mode</Heading>
                <Heading>Dark Tinted Mode</Heading>
              </Columns>
            </Stack>
            <Stack space="none">
              {Object.entries(foregroundColors).map(
                ([foregroundName, foreground], colorIndex, arr) => (
                  <Columns key={colorIndex} space={GRID_SPACING}>
                    {(typeof foreground === 'string'
                      ? [
                          [foreground, BODY_LIGHT],
                          [foreground, BODY_DARK],
                          [foreground, BODY_DARK],
                        ]
                      : [
                          [foreground.light, BODY_LIGHT],
                          [foreground.dark, BODY_DARK],
                          [foreground.darkTinted ?? foreground.dark, BODY_DARK],
                        ]
                    ).map(([color, backgroundColor], index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: backgroundColor,
                          borderBottomLeftRadius:
                            colorIndex === arr.length - 1
                              ? CARD_RADIUS
                              : undefined,
                          borderBottomRightRadius:
                            colorIndex === arr.length - 1
                              ? CARD_RADIUS
                              : undefined,
                          borderTopLeftRadius:
                            colorIndex === 0 ? CARD_RADIUS : undefined,
                          borderTopRightRadius:
                            colorIndex === 0 ? CARD_RADIUS : undefined,
                          height: '100%',
                          paddingBottom: CARD_GUTTER,
                          paddingLeft: CARD_GUTTER,
                          paddingRight: CARD_GUTTER,
                          paddingTop: colorIndex === 0 ? CARD_GUTTER : 0,
                        }}
                      >
                        <Stack space="8px">
                          <div
                            style={{
                              color: color,
                              fontSize: TEXT_SIZE,
                              fontWeight: 800,
                              wordBreak: 'break-word',
                            }}
                          >
                            {foregroundName}
                          </div>
                          <div
                            style={{
                              color: color,
                              fontSize: TEXT_SIZE,
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            }}
                          >
                            {color}
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Columns>
                )
              )}
            </Stack>
          </Stack>
        </Stack>
      </div>
    </>
  );
};

export default Home;
