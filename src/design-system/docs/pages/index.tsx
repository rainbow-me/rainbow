import type { NextPage } from 'next';
import Head from 'next/head';
import React, { Children, Fragment, ReactNode } from 'react';
import { backgroundColors, foregroundColors } from '../../color/palettes';
import { fontWeights } from '../../typography/fontWeights';
import { typeHierarchy } from '../../typography/typeHierarchy';
import { Radii, Space, sprinkles } from '../styles/sprinkles.css';

const GRID_SPACING: Space = '16px';
const CARD_GUTTER: Space = '32px';
const CARD_RADIUS: Radii = '16px';

const fontWeightFromString = {
  '400': 400,
  '500': 500,
  '600': 600,
  '700': 700,
  '800': 800,
} as const;

const Title = ({ children }: { children: ReactNode }) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <h1
    className={sprinkles({
      color: 'primary',
      fontSize: '23px',
      fontWeight: 800,
    })}
  >
    {children}
  </h1>
);

const Heading = ({ children }: { children: ReactNode }) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <h2
    className={sprinkles({
      color: 'secondary',
      fontSize: '23px',
      fontWeight: 700,
    })}
  >
    {children}
  </h2>
);

const Stack = ({ space, children }: { space: Space; children: ReactNode }) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    className={sprinkles({
      display: 'flex',
      flexDirection: 'column',
      gap: space,
    })}
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
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    className={sprinkles({
      display: 'flex',
      flexDirection: 'row',
      gap: space,
      width: '100%',
    })}
  >
    {Children.map(children, child => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={sprinkles({
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
        })}
      >
        {child}
      </div>
    ))}
  </div>
);

const Card = ({
  backgroundColor = 'white',
  height,
  children,
}: {
  backgroundColor?: string;
  height?: 'full';
  children: ReactNode;
}) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    className={sprinkles({
      borderRadius: CARD_RADIUS,
      height: height === 'full' ? '100%' : undefined,
      padding: CARD_GUTTER,
      paddingVertical: CARD_GUTTER,
    })}
    style={{ backgroundColor }}
  >
    {children}
  </div>
);

const Home: NextPage = () => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Head>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <title>Rainbow Design System Cheat Sheet</title>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <link href="/favicon.ico" rel="icon" />
      </Head>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <div
        className={sprinkles({
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '1020px',
          paddingBottom: '48px',
          paddingLeft: GRID_SPACING,
          paddingRight: GRID_SPACING,
          paddingTop: '48px',
        })}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Stack space="64px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="24px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space="12px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Title>Typography</Title>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Columns space={GRID_SPACING}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Heading Sizes</Heading>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Text Sizes</Heading>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Font Weights</Heading>
              </Columns>
            </Stack>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Columns space={GRID_SPACING}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Card height="full">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Stack space={CARD_GUTTER}>
                  {Object.entries(typeHierarchy.heading).map(
                    (
                      [sizeName, { fontSize, lineHeight, letterSpacing }],
                      index
                    ) => (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div key={index} style={{ fontSize }}>
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <div
                          className={sprinkles({
                            color: 'primary',
                            fontWeight: 800,
                          })}
                        >
                          {sizeName} heading
                        </div>
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <div
                          className={sprinkles({
                            color: 'secondary',
                            fontWeight: 500,
                          })}
                        >
                          {lineHeight}
                          px line height // @ts-expect-error ts-migrate(17004)
                          FIXME: Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error
                          message
                          <br />
                          {letterSpacing}px spacing
                        </div>
                      </div>
                    )
                  )}
                </Stack>
              </Card>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Card height="full">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Stack space={CARD_GUTTER}>
                  {Object.entries(typeHierarchy.text).map(
                    (
                      [sizeName, { fontSize, lineHeight, letterSpacing }],
                      index
                    ) => (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div key={index} style={{ fontSize }}>
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <div
                          className={sprinkles({
                            color: 'primary',
                            fontWeight: 800,
                          })}
                        >
                          {sizeName} text
                        </div>
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <div
                          className={sprinkles({
                            color: 'secondary',
                            fontWeight: 600,
                          })}
                        >
                          {lineHeight}
                          px line height // @ts-expect-error ts-migrate(17004)
                          FIXME: Cannot use JSX unless the '--jsx' flag is
                          provided... Remove this comment to see the full error
                          message
                          <br />
                          {letterSpacing}px spacing
                        </div>
                      </div>
                    )
                  )}
                </Stack>
              </Card>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Card height="full">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Stack space="12px">
                  {Object.entries(fontWeights).map(
                    ([fontWeightName, fontWeight], index) => (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className={sprinkles({
                          color: 'primary',
                          fontSize: '18px',
                          fontWeight: fontWeightFromString[fontWeight],
                        })}
                        key={index}
                      >
                        {fontWeightName} ({fontWeight})
                      </div>
                    )
                  )}
                </Stack>
              </Card>
            </Columns>
          </Stack>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="24px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space="12px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Title>Background Colors</Title>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Columns space={GRID_SPACING}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Light Mode</Heading>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Dark Mode</Heading>
              </Columns>
            </Stack>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space={GRID_SPACING}>
              {Object.entries(backgroundColors).map(
                ([backgroundName, background], i) => (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Columns key={i} space={GRID_SPACING}>
                    {('color' in background
                      ? [background, background]
                      : [background.light, background.dark]
                    ).map(({ color: backgroundColor, mode }, index) => (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className={sprinkles({
                          borderRadius: CARD_RADIUS,
                          color: mode === 'light' ? 'primary' : 'white',
                          padding: CARD_GUTTER,
                        })}
                        key={index}
                        style={{ backgroundColor }}
                      >
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <Stack space="8px">
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot
                          use JSX unless the '--jsx' flag is provided... Remove
                          this comment to see the full error message
                          <div
                            className={sprinkles({
                              fontSize: '18px',
                              fontWeight: 800,
                              wordBreak: 'break-word',
                            })}
                          >
                            {backgroundName}
                          </div>
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot
                          use JSX unless the '--jsx' flag is provided... Remove
                          this comment to see the full error message
                          <div
                            className={sprinkles({
                              color:
                                mode === 'light'
                                  ? 'secondary'
                                  : 'secondaryDark',
                              fontSize: '18px',
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            })}
                          >
                            {backgroundColor}
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Columns>
                )
              )}
            </Stack>
          </Stack>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="24px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space="12px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Title>Foreground Colors</Title>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Columns space={GRID_SPACING}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Light Mode</Heading>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Light Tinted Mode</Heading>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Dark Mode</Heading>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Dark Tinted Mode</Heading>
              </Columns>
            </Stack>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space="none">
              {Object.entries(foregroundColors).map(
                ([foregroundName, foreground], colorIndex, arr) => (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Columns key={colorIndex} space={GRID_SPACING}>
                    {(typeof foreground === 'string'
                      ? ([
                          [foreground, 'bodyLight'],
                          [foreground, { custom: '#dee2ff' }],
                          [foreground, 'bodyDark'],
                          [foreground, { custom: '#141938' }],
                        ] as const)
                      : ([
                          [foreground.light, 'bodyLight'],
                          [
                            foreground.lightTinted ?? foreground.light,
                            { custom: '#dee2ff' },
                          ],
                          [foreground.dark, 'bodyDark'],
                          [
                            foreground.darkTinted ?? foreground.dark,
                            { custom: '#141938' },
                          ],
                        ] as const)
                    ).map(([color, backgroundColor], index) => (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className={sprinkles({
                          backgroundColor:
                            typeof backgroundColor === 'string'
                              ? backgroundColor
                              : undefined,
                          borderBottomRadius:
                            colorIndex === arr.length - 1
                              ? CARD_RADIUS
                              : undefined,
                          borderTopRadius:
                            colorIndex === 0 ? CARD_RADIUS : undefined,
                          height: '100%',
                          padding: CARD_GUTTER,
                          paddingTop: colorIndex === 0 ? CARD_GUTTER : 'none',
                        })}
                        key={index}
                        style={
                          typeof backgroundColor === 'object'
                            ? { backgroundColor: backgroundColor.custom }
                            : undefined
                        }
                      >
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <Stack space="8px">
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot
                          use JSX unless the '--jsx' flag is provided... Remove
                          this comment to see the full error message
                          <div
                            className={sprinkles({
                              fontSize: '18px',
                              fontWeight: 800,
                              wordBreak: 'break-word',
                            })}
                            style={{ color }}
                          >
                            {foregroundName}
                          </div>
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot
                          use JSX unless the '--jsx' flag is provided... Remove
                          this comment to see the full error message
                          <div
                            className={sprinkles({
                              fontSize: '18px',
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            })}
                            style={{ color }}
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
