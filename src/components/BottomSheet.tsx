import * as React from 'react'
import { Dimensions, Platform, View, LayoutChangeEvent } from 'react-native'
import Animated from 'react-native-reanimated'
import {
  PanGestureHandler,
  TapGestureHandler,
  State as GestureState,
} from 'react-native-gesture-handler'

type Props = {
  /**
   * Points for snapping of bottom sheet component. They define distance from bottom of the screen.
   * Might be number or percent (as string e.g. '20%') for points or percents of screen height from bottom.
   */
  snapPoints: (number | string)[]

  /**
   * Determines initial snap point of bottom sheet. Defaults to 0.
   */
  initialSnap: number

  /**
   * Method for rendering scrollable content of bottom sheet.
   */
  renderContent?: () => React.ReactNode

  /**
   * Method for rendering non-scrollable header of bottom sheet.
   */
  renderHeader?: () => React.ReactNode

  /**
   * Defines if bottom sheet could be scrollable by gesture. Defaults to true.
   */
  enabledGestureInteraction?: boolean
  enabledHeaderGestureInteraction?: boolean
  enabledContentGestureInteraction?: boolean

  /**
   * Defines if bottom sheet content responds to taps. Defaults to true.
   */
  enabledContentTapInteraction?: boolean

  /**
   * When true, clamp bottom position to first snapPoint.
   */
  enabledBottomClamp?: boolean

  /**
   * If false blocks snapping using snapTo method. Defaults to true.
   */
  enabledManualSnapping?: boolean

  /**
   * Defines whether it's possible to scroll inner content of bottom sheet. Defaults to true.
   */
  enabledInnerScrolling?: boolean

  /**
   * Reanimated node which holds position of bottom sheet, where 1 it the highest snap point and 0 is the lowest.
   */
  callbackNode?: Animated.Value<number>

  /**
   * Reanimated node which holds position of bottom sheet;s content (in dp).
   */
  contentPosition?: Animated.Value<number>

  /**
   * Reanimated node which holds position of bottom sheet's header (in dp).
   */
  headerPosition?: Animated.Value<number>

  /**
   * Defines how violently sheet has to stopped while overdragging. 0 means no overdrag. Defaults to 0.
   */
  overdragResistanceFactor: number

  /**
   * Array of Refs passed to gesture handlers for simultaneous event handling
   */
  simultaneousHandlers?: Array<React.RefObject<any>> | React.RefObject<any>

  /**
   * Overrides config for spring animation
   */
  springConfig: {
    damping?: number
    mass?: number
    stiffness?: number
    restSpeedThreshold?: number
    restDisplacementThreshold?: number
    toss?: number
  }

  /**
   * Refs for gesture handlers used for building bottomsheet
   */
  innerGestureHandlerRefs: [
    React.RefObject<PanGestureHandler>,
    React.RefObject<PanGestureHandler>,
    React.RefObject<TapGestureHandler>
  ]

  enabledImperativeSnapping?: boolean

  onOpenStart?: () => void
  onOpenEnd?: () => void
  onCloseStart?: () => void
  onCloseEnd?: () => void
  callbackThreshold?: number
}

type State = {
  snapPoints: Animated.Value<number>[]
  init: any
  initSnap: number
  propsToNewIndices: { [key: string]: number }
  heightOfContent: Animated.Value<number>
  heightOfHeader: number
  heightOfHeaderAnimated: Animated.Value<number>
}

const { height: screenHeight } = Dimensions.get('window')

const P = <T extends any>(android: T, ios: T): T =>
  Platform.OS === 'ios' ? ios : android

const magic = {
  damping: 30,
  mass: 1,
  stiffness: 300,
  overshootClamping: false,
  restSpeedThreshold: 50,
  restDisplacementThreshold: 0.99,
  deceleration: 0.998,
  velocityFactor: P(1, 1),
  toss: 20,
}

const {
  damping,
  mass,
  stiffness,
  overshootClamping,
  restSpeedThreshold,
  restDisplacementThreshold,
  deceleration,
  velocityFactor,
  toss,
} = magic

const {
  set,
  cond,
  onChange,
  block,
  eq,
  greaterOrEq,
  sqrt,
  not,
  defined,
  max,
  add,
  and,
  Value,
  spring,
  or,
  divide,
  greaterThan,
  sub,
  event,
  diff,
  multiply,
  clockRunning,
  startClock,
  stopClock,
  decay,
  Clock,
  lessThan,
  call,
  lessOrEq,
  neq,
} = Animated

function runDecay(
  clock: Animated.Clock,
  value: Animated.Node<number>,
  velocity: Animated.Node<number>,
  wasStartedFromBegin: Animated.Value<number>
) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  }

  const config = { deceleration }

  return [
    cond(clockRunning(clock), 0, [
      cond(wasStartedFromBegin, 0, [
        set(wasStartedFromBegin, 1),
        set(state.finished, 0),
        set(state.velocity, multiply(velocity, velocityFactor)),
        set(state.position, value),
        set(state.time, 0),
        startClock(clock),
      ]),
    ]),
    cond(clockRunning(clock), decay(clock, state, config)),
    cond(state.finished, stopClock(clock)),
    state.position,
  ]
}

function withPreservingAdditiveOffset(
  drag: Animated.Node<number>,
  state: Animated.Node<number>
) {
  const prev = new Value(0)
  const valWithPreservedOffset = new Value(0)
  return block([
    cond(
      eq(state, GestureState.BEGAN),
      [set(prev, 0)],
      [
        set(
          valWithPreservedOffset,
          add(valWithPreservedOffset, sub(drag, prev))
        ),
        set(prev, drag),
      ]
    ),
    valWithPreservedOffset,
  ])
}

function withDecaying(
  drag: Animated.Node<number>,
  state: Animated.Node<number>,
  decayClock: Animated.Clock,
  velocity: Animated.Node<number>,
  prevent: Animated.Value<number>
) {
  const valDecayed = new Value(0)
  const offset = new Value(0)
  // since there might be moar than one clock
  const wasStartedFromBegin = new Value(0)
  return block([
    cond(
      eq(state, GestureState.END),
      [
        cond(
          prevent,
          stopClock(decayClock),
          set(
            valDecayed,
            runDecay(
              decayClock,
              add(drag, offset),
              velocity,
              wasStartedFromBegin
            )
          )
        ),
      ],
      [
        stopClock(decayClock),
        cond(eq(state, GestureState.BEGAN), set(prevent, 0)),
        cond(
          or(eq(state, GestureState.BEGAN), eq(state, GestureState.ACTIVE)),
          set(wasStartedFromBegin, 0)
        ),
        cond(eq(state, GestureState.BEGAN), [
          set(offset, sub(valDecayed, drag)),
        ]),
        set(valDecayed, add(drag, offset)),
      ]
    ),
    valDecayed,
  ])
}

export default class BottomSheetBehavior extends React.Component<Props, State> {
  static defaultProps = {
    overdragResistanceFactor: 0,
    initialSnap: 0,
    enabledImperativeSnapping: true,
    enabledGestureInteraction: true,
    enabledBottomClamp: false,
    enabledHeaderGestureInteraction: true,
    enabledContentGestureInteraction: true,
    enabledContentTapInteraction: true,
    enabledInnerScrolling: true,
    springConfig: {},
    innerGestureHandlerRefs: [
      React.createRef(),
      React.createRef(),
      React.createRef(),
    ],
    callbackThreshold: 0.01,
  }

  private decayClock = new Clock()
  private panState = new Value(0)
  private tapState = new Value(0)
  private velocity = new Value(0)
  private panMasterState = new Value(GestureState.END)
  private masterVelocity = new Value(0)
  private isManuallySetValue: Animated.Value<number> = new Value(0)
  private manuallySetValue = new Value(0)
  private masterClockForOverscroll = new Clock()
  private preventDecaying: Animated.Value<number> = new Value(0)
  private dragMasterY = new Value(0)
  private dragY = new Value(0)
  private translateMaster: Animated.Node<number>
  private panRef: React.RefObject<PanGestureHandler>
  private master: React.RefObject<PanGestureHandler>
  private tapRef: React.RefObject<TapGestureHandler>
  private snapPoint: Animated.Node<number>
  private Y: Animated.Node<number>
  private clampingValue: Animated.Value<number> = new Value(0)
  private onOpenStartValue: Animated.Value<number> = new Value(0)
  private onOpenEndValue: Animated.Value<number> = new Value(0)
  private onCloseStartValue: Animated.Value<number> = new Value(1)
  private onCloseEndValue: Animated.Value<number> = new Value(0)

  constructor(props: Props) {
    super(props)

    this.panRef = props.innerGestureHandlerRefs[0]
    this.master = props.innerGestureHandlerRefs[1]
    this.tapRef = props.innerGestureHandlerRefs[2]
    this.state = BottomSheetBehavior.getDerivedStateFromProps(props, undefined)

    const { snapPoints, init } = this.state
    const middlesOfSnapPoints: Animated.Node<number>[] = []
    for (let i = 1; i < snapPoints.length; i++) {
      middlesOfSnapPoints.push(divide(add(snapPoints[i - 1], snapPoints[i]), 2))
    }
    const masterOffseted = new Value(init)
    // destination point is a approximation of movement if finger released
    const tossForMaster =
      props.springConfig.hasOwnProperty('toss') &&
      props.springConfig.toss != undefined
        ? props.springConfig.toss
        : toss
    const destinationPoint = add(
      masterOffseted,
      multiply(tossForMaster, this.masterVelocity)
    )
    // method for generating condition for finding the nearest snap point
    const currentSnapPoint = (i = 0): Animated.Node<number> =>
      i + 1 === snapPoints.length
        ? snapPoints[i]
        : cond(
            lessThan(destinationPoint, middlesOfSnapPoints[i]),
            snapPoints[i],
            currentSnapPoint(i + 1)
          )
    // current snap point desired
    this.snapPoint = currentSnapPoint()

    if (props.enabledBottomClamp) {
      this.clampingValue.setValue(snapPoints[snapPoints.length - 1])
    }

    const masterClock = new Clock()
    const prevMasterDrag = new Value(0)
    const wasRun: Animated.Value<number> = new Value(0)
    this.translateMaster = block([
      cond(
        or(
          eq(this.panMasterState, GestureState.END),
          eq(this.panMasterState, GestureState.CANCELLED)
        ),
        [
          set(prevMasterDrag, 0),
          cond(
            or(clockRunning(masterClock), not(wasRun), this.isManuallySetValue),
            [
              cond(this.isManuallySetValue, stopClock(masterClock)),
              set(
                masterOffseted,
                this.runSpring(
                  masterClock,
                  masterOffseted,
                  this.masterVelocity,
                  cond(
                    this.isManuallySetValue,
                    this.manuallySetValue,
                    this.snapPoint
                  ),
                  wasRun,
                  this.isManuallySetValue
                )
              ),
              set(this.isManuallySetValue, 0),
            ]
          ),
        ],
        [
          stopClock(masterClock),
          set(this.preventDecaying, 1),
          set(
            masterOffseted,
            add(masterOffseted, sub(this.dragMasterY, prevMasterDrag))
          ),
          set(prevMasterDrag, this.dragMasterY),
          set(wasRun, 0), // not sure about this move for cond-began
          cond(
            eq(this.panMasterState, GestureState.BEGAN),
            stopClock(this.masterClockForOverscroll)
          ),
        ]
      ),
      cond(
        greaterThan(masterOffseted, snapPoints[0]),
        cond(
          and(
            props.enabledBottomClamp ? 1 : 0,
            greaterThan(masterOffseted, this.clampingValue)
          ),
          this.clampingValue,
          masterOffseted
        ),
        max(
          multiply(
            sub(
              snapPoints[0],
              sqrt(add(1, sub(snapPoints[0], masterOffseted)))
            ),
            props.overdragResistanceFactor
          ),
          masterOffseted
        )
      ),
    ])

    this.Y = this.withEnhancedLimits(
      withDecaying(
        withPreservingAdditiveOffset(this.dragY, this.panState),
        this.panState,
        this.decayClock,
        this.velocity,
        this.preventDecaying
      ),
      masterOffseted
    )
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    const { snapPoints } = this.state
    if (this.props.enabledBottomClamp && snapPoints !== prevState.snapPoints) {
      this.clampingValue.setValue(snapPoints[snapPoints.length - 1])
    }
  }

  private runSpring(
    clock: Animated.Clock,
    value: Animated.Value<number>,
    velocity: Animated.Node<number>,
    dest: Animated.Node<number>,
    wasRun: Animated.Value<number>,
    isManuallySet: Animated.Node<number> | number = 0
  ) {
    const state = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    }

    const config = {
      damping,
      mass,
      stiffness,
      overshootClamping,
      restSpeedThreshold,
      restDisplacementThreshold,
      toValue: new Value(0),
      ...this.props.springConfig,
    }

    return [
      cond(clockRunning(clock), 0, [
        set(state.finished, 0),
        set(state.velocity, multiply(velocity, velocityFactor)),
        set(state.position, value),
        set(config.toValue, dest),
        cond(and(wasRun, not(isManuallySet)), 0, startClock(clock)),
        cond(defined(wasRun), set(wasRun, 1)),
      ]),
      spring(clock, state, config),
      cond(state.finished, stopClock(clock)),
      state.position,
    ]
  }

  private handleMasterPan = event([
    {
      nativeEvent: {
        translationY: this.dragMasterY,
        state: this.panMasterState,
        velocityY: this.masterVelocity,
      },
    },
  ])

  private handlePan = event([
    {
      nativeEvent: {
        translationY: this.props.enabledInnerScrolling
          ? this.dragY
          : this.dragMasterY,
        state: this.props.enabledInnerScrolling
          ? this.panState
          : this.panMasterState,
        velocityY: this.props.enabledInnerScrolling
          ? this.velocity
          : this.masterVelocity,
      },
    },
  ])

  // private handlePan = event([
  //   {
  //     nativeEvent: {
  //       translationY: this.dragMasterY,
  //       state: this.panMasterState,
  //       velocityY: this.masterVelocity,
  //     },
  //   },
  // ])

  private handleTap = event([{ nativeEvent: { state: this.tapState } }])

  private withEnhancedLimits(
    val: Animated.Node<number>,
    masterOffseted: Animated.Value<number>
  ) {
    const wasRunMaster = new Value(0)
    const min = multiply(
      -1,
      add(this.state.heightOfContent, this.state.heightOfHeaderAnimated)
    )
    const prev = new Value(0)
    const limitedVal = new Value(0)
    const diffPres = new Value(0)
    const flagWasRunSpring = new Value(0)
    const justEndedIfEnded = new Value(1)
    const wasEndedMasterAfterInner = new Value(1)
    const prevMaster = new Value(1)
    const prevState = new Value(0)
    const rev = new Value(0)

    return block([
      set(rev, limitedVal),
      cond(
        or(
          eq(this.panState, GestureState.BEGAN),
          and(
            eq(this.panState, GestureState.ACTIVE),
            eq(prevState, GestureState.END)
          )
        ),
        [
          set(prev, val),
          set(flagWasRunSpring, 0),
          stopClock(this.masterClockForOverscroll),
          set(wasRunMaster, 0),
        ],
        [
          set(limitedVal, add(limitedVal, sub(val, prev))),
          cond(lessThan(limitedVal, min), set(limitedVal, min)),
        ]
      ),
      set(prevState, this.panState), // on iOS sometimes BEGAN event does not trigger
      set(diffPres, sub(prev, val)),
      set(prev, val),
      cond(
        or(greaterOrEq(limitedVal, 0), greaterThan(masterOffseted, 0)),
        [
          cond(
            eq(this.panState, GestureState.ACTIVE),
            set(masterOffseted, sub(masterOffseted, diffPres))
          ),
          cond(greaterThan(masterOffseted, 0), [set(limitedVal, 0)]),
          cond(
            not(eq(this.panState, GestureState.END)),
            set(justEndedIfEnded, 1)
          ),
          cond(
            or(
              eq(this.panState, GestureState.ACTIVE),
              eq(this.panMasterState, GestureState.ACTIVE)
            ),
            set(wasEndedMasterAfterInner, 0)
          ),
          cond(
            and(
              eq(prevMaster, GestureState.ACTIVE),
              eq(this.panMasterState, GestureState.END),
              eq(this.panState, GestureState.END)
            ),
            set(wasEndedMasterAfterInner, 1)
          ),
          set(prevMaster, this.panMasterState),
          cond(
            and(
              eq(this.panState, GestureState.END),
              not(wasEndedMasterAfterInner),
              not(eq(this.panMasterState, GestureState.ACTIVE)),
              not(eq(this.panMasterState, GestureState.BEGAN)),
              or(clockRunning(this.masterClockForOverscroll), not(wasRunMaster))
            ),
            [
              // cond(justEndedIfEnded, set(this.masterVelocity, diff(val))),
              set(
                this.masterVelocity,
                cond(justEndedIfEnded, diff(val), this.velocity)
              ),
              set(
                masterOffseted,
                this.runSpring(
                  this.masterClockForOverscroll,
                  masterOffseted,
                  diff(val),
                  this.snapPoint,
                  wasRunMaster
                )
              ),
              set(this.masterVelocity, 0),
            ]
          ),
          //   cond(eq(this.panState, State.END), set(wasEndedMasterAfterInner, 0)),
          cond(eq(this.panState, GestureState.END), set(justEndedIfEnded, 0)),
          set(this.preventDecaying, 1),
          0,
        ],
        [set(this.preventDecaying, 0), limitedVal]
      ),
    ])
  }

  snapTo = (index: number) => {
    if (!this.props.enabledImperativeSnapping) {
      return
    }
    this.manuallySetValue.setValue(
      // @ts-ignore
      this.state.snapPoints[this.state.propsToNewIndices[index]]
    )
    this.isManuallySetValue.setValue(1)
  }

  private height: Animated.Value<number> = new Value(0)

  private handleLayoutHeader = ({
    nativeEvent: {
      layout: { height: heightOfHeader },
    },
  }: LayoutChangeEvent) => {
    this.state.heightOfHeaderAnimated.setValue(heightOfHeader)
    this.setState({ heightOfHeader })
  }

  private handleFullHeader = ({
    nativeEvent: {
      layout: { height },
    },
  }: LayoutChangeEvent) => this.height.setValue(height)

  private handleLayoutContent = ({
    nativeEvent: {
      layout: { height },
    },
  }: LayoutChangeEvent) =>
    this.state.heightOfContent.setValue(height - this.state.initSnap)

  static renumber = (str: string) =>
    (Number(str.split('%')[0]) * screenHeight) / 100

  static getDerivedStateFromProps(
    props: Props,
    state: State | undefined
  ): State {
    let snapPoints
    const sortedPropsSnapPoints: Array<{
      val: number
      ind: number
    }> = props.snapPoints
      .map(
        (
          s: number | string,
          i: number
        ): {
          val: number
          ind: number
        } => {
          if (typeof s === 'number') {
            return { val: s, ind: i }
          } else if (typeof s === 'string') {
            return { val: BottomSheetBehavior.renumber(s), ind: i }
          }

          throw new Error(`Invalid type for value ${s}: ${typeof s}`)
        }
      )
      .sort(({ val: a }, { val: b }) => b - a)
    if (state && state.snapPoints) {
      state.snapPoints.forEach((s, i) =>
        s.setValue(sortedPropsSnapPoints[0].val - sortedPropsSnapPoints[i].val)
      )
      snapPoints = state.snapPoints
    } else {
      snapPoints = sortedPropsSnapPoints.map(
        p => new Value(sortedPropsSnapPoints[0].val - p.val)
      )
    }

    const propsToNewIndices: { [key: string]: number } = {}
    sortedPropsSnapPoints.forEach(({ ind }, i) => (propsToNewIndices[ind] = i))

    const { initialSnap } = props

    return {
      init:
        sortedPropsSnapPoints[0].val -
        sortedPropsSnapPoints[propsToNewIndices[initialSnap]].val,
      propsToNewIndices,
      heightOfHeaderAnimated:
        (state && state.heightOfHeaderAnimated) || new Value(0),
      heightOfContent: (state && state.heightOfContent) || new Value(0),
      initSnap: sortedPropsSnapPoints[0].val,
      snapPoints,
      heightOfHeader: (state && state.heightOfHeader) || 0,
    }
  }

  render() {
    return (
      <React.Fragment>
        <Animated.View
          style={{
            height: '100%',
            width: 0,
            position: 'absolute',
          }}
          onLayout={this.handleFullHeader}
        />
        <Animated.View
          style={{
            width: '100%',
            position: 'absolute',
            zIndex: 100,
            opacity: cond(this.height, 1, 0),
            transform: [
              {
                translateY: this.translateMaster,
              },
              {
                translateY: sub(this.height, this.state.initSnap) as any,
              },
            ],
          }}
        >
          <PanGestureHandler
            enabled={
              this.props.enabledGestureInteraction &&
              this.props.enabledHeaderGestureInteraction
            }
            ref={this.master}
            waitFor={this.panRef}
            onGestureEvent={this.handleMasterPan}
            onHandlerStateChange={this.handleMasterPan}
            simultaneousHandlers={this.props.simultaneousHandlers}
          >
            <Animated.View
              style={{
                zIndex: 101,
              }}
              onLayout={this.handleLayoutHeader}
            >
              {this.props.renderHeader && this.props.renderHeader()}
            </Animated.View>
          </PanGestureHandler>
          <View
            style={
              this.props.enabledInnerScrolling && {
                height: this.state.initSnap - this.state.heightOfHeader,
                overflow: 'hidden',
              }
            }
          >
            <PanGestureHandler
              enabled={
                this.props.enabledGestureInteraction &&
                this.props.enabledContentGestureInteraction
              }
              waitFor={this.master}
              ref={this.panRef}
              onGestureEvent={this.handlePan}
              onHandlerStateChange={this.handlePan}
              simultaneousHandlers={this.props.simultaneousHandlers}
            >
              <Animated.View>
                <TapGestureHandler
                  ref={this.tapRef}
                  enabled={
                    this.props.enabledGestureInteraction &&
                    this.props.enabledContentGestureInteraction &&
                    this.props.enabledContentTapInteraction
                  }
                  onHandlerStateChange={this.handleTap}
                  simultaneousHandlers={this.props.simultaneousHandlers}
                >
                  <Animated.View
                    style={{
                      width: '100%',
                      transform: [{ translateY: this.Y as any }],
                    }}
                    onLayout={this.handleLayoutContent}
                  >
                    {this.props.renderContent && this.props.renderContent()}
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </PanGestureHandler>
            <Animated.Code
              exec={onChange(
                this.tapState,
                cond(
                  eq(this.tapState, GestureState.BEGAN),
                  stopClock(this.decayClock)
                )
              )}
            />
            {this.props.callbackNode && (
              <Animated.Code
                exec={onChange(
                  this.translateMaster,
                  set(
                    this.props.callbackNode,
                    divide(
                      this.translateMaster,
                      this.state.snapPoints[this.state.snapPoints.length - 1]
                    )
                  )
                )}
              />
            )}
            {(this.props.onOpenStart || this.props.onCloseEnd) && (
              <Animated.Code
                exec={onChange(this.translateMaster, [
                  cond(
                    and(
                      lessOrEq(
                        divide(
                          this.translateMaster,
                          this.state.snapPoints[
                            this.state.snapPoints.length - 1
                          ]
                        ),
                        1 -
                          (this.props.callbackThreshold
                            ? this.props.callbackThreshold
                            : 0.01)
                      ),
                      neq(this.onOpenStartValue, 1)
                    ),
                    [
                      call([], () => {
                        if (this.props.onOpenStart) this.props.onOpenStart()
                      }),
                      set(this.onOpenStartValue, 1),
                      cond(
                        defined(this.onCloseEndValue),
                        set(this.onCloseEndValue, 0)
                      ),
                    ]
                  ),
                ])}
              />
            )}
            {(this.props.onOpenEnd || this.props.onCloseStart) && (
              <Animated.Code
                exec={onChange(this.translateMaster, [
                  cond(
                    and(
                      lessOrEq(
                        divide(
                          this.translateMaster,
                          this.state.snapPoints[
                            this.state.snapPoints.length - 1
                          ]
                        ),
                        this.props.callbackThreshold
                          ? this.props.callbackThreshold
                          : 0.01
                      ),
                      neq(this.onOpenEndValue, 1)
                    ),
                    [
                      call([], () => {
                        if (this.props.onOpenEnd) this.props.onOpenEnd()
                      }),
                      set(this.onOpenEndValue, 1),
                      cond(
                        defined(this.onCloseStartValue),
                        set(this.onCloseStartValue, 0)
                      ),
                    ]
                  ),
                ])}
              />
            )}
            {(this.props.onCloseStart || this.props.onOpenEnd) && (
              <Animated.Code
                exec={onChange(this.translateMaster, [
                  cond(
                    and(
                      greaterOrEq(
                        divide(
                          this.translateMaster,
                          this.state.snapPoints[
                            this.state.snapPoints.length - 1
                          ]
                        ),
                        this.props.callbackThreshold
                          ? this.props.callbackThreshold
                          : 0.01
                      ),
                      neq(this.onCloseStartValue, 1)
                    ),
                    [
                      call([], () => {
                        if (this.props.onCloseStart) this.props.onCloseStart()
                      }),
                      set(this.onCloseStartValue, 1),
                      cond(
                        defined(this.onCloseStartValue),
                        set(this.onOpenEndValue, 0)
                      ),
                    ]
                  ),
                ])}
              />
            )}
            {(this.props.onCloseEnd || this.props.onOpenStart) && (
              <Animated.Code
                exec={onChange(this.translateMaster, [
                  cond(
                    and(
                      greaterOrEq(
                        divide(
                          this.translateMaster,
                          this.state.snapPoints[
                            this.state.snapPoints.length - 1
                          ]
                        ),
                        1 -
                          (this.props.callbackThreshold
                            ? this.props.callbackThreshold
                            : 0.01)
                      ),
                      neq(this.onCloseEndValue, 1)
                    ),
                    [
                      call([], () => {
                        if (this.props.onCloseEnd) this.props.onCloseEnd()
                      }),
                      set(this.onCloseEndValue, 1),
                      cond(
                        defined(this.onOpenStartValue),
                        set(this.onOpenStartValue, 0)
                      ),
                      cond(
                        defined(this.onOpenEndValue),
                        set(this.onOpenEndValue, 0)
                      ),
                    ]
                  ),
                ])}
              />
            )}
            {this.props.contentPosition && (
              <Animated.Code
                exec={onChange(
                  this.Y,
                  set(this.props.contentPosition, sub(0, this.Y))
                )}
              />
            )}
            {this.props.headerPosition && (
              <Animated.Code
                exec={onChange(
                  this.translateMaster,
                  set(this.props.headerPosition, this.translateMaster)
                )}
              />
            )}
          </View>
        </Animated.View>
      </React.Fragment>
    )
  }
}
