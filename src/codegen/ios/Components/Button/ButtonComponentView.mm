//
//  ButtonComponentView.mm
//  Rainbow
//

#import <QuartzCore/QuartzCore.h>
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/rainbow/ComponentDescriptors.h>
#import <react/renderer/components/rainbow/EventEmitters.h>
#import <react/renderer/components/rainbow/Props.h>
#import <react/renderer/components/rainbow/RCTComponentViewHelpers.h>

using namespace facebook::react;

static constexpr CFTimeInterval kThrottleDurationSeconds = 0.5;

static NSTimeInterval SecondsFromMilliseconds(double milliseconds)
{
  return milliseconds / 1000.0;
}

static NSTimeInterval OptionalSecondsFromMilliseconds(double milliseconds)
{
  return milliseconds == -1.0 ? -1.0 : SecondsFromMilliseconds(milliseconds);
}

typedef NS_ENUM(uint8_t, ButtonHapticType) {
  ButtonHapticTypeNone,
  ButtonHapticTypeSelection,
  ButtonHapticTypeNotificationError,
  ButtonHapticTypeNotificationSuccess,
  ButtonHapticTypeNotificationWarning,
  ButtonHapticTypeImpactLight,
  ButtonHapticTypeImpactMedium,
  ButtonHapticTypeImpactHeavy,
};

static ButtonHapticType ButtonHapticTypeFromString(const std::string &hapticType)
{
  if (hapticType == "error" || hapticType == "notificationError") {
    return ButtonHapticTypeNotificationError;
  }
  if (hapticType == "success" || hapticType == "notificationSuccess") {
    return ButtonHapticTypeNotificationSuccess;
  }
  if (hapticType == "warning" || hapticType == "notificationWarning") {
    return ButtonHapticTypeNotificationWarning;
  }
  if (hapticType == "light" || hapticType == "impactLight") {
    return ButtonHapticTypeImpactLight;
  }
  if (hapticType == "medium" || hapticType == "impactMedium") {
    return ButtonHapticTypeImpactMedium;
  }
  if (hapticType == "heavy" || hapticType == "impactHeavy") {
    return ButtonHapticTypeImpactHeavy;
  }
  return ButtonHapticTypeSelection;
}

static void GenerateHapticFeedback(ButtonHapticType hapticType)
{
  switch (hapticType) {
    case ButtonHapticTypeNone:
      return;
    case ButtonHapticTypeSelection: {
      static UISelectionFeedbackGenerator *generator = [UISelectionFeedbackGenerator new];
      [generator selectionChanged];
      return;
    }
    case ButtonHapticTypeNotificationError: {
      static UINotificationFeedbackGenerator *generator = [UINotificationFeedbackGenerator new];
      [generator notificationOccurred:UINotificationFeedbackTypeError];
      return;
    }
    case ButtonHapticTypeNotificationSuccess: {
      static UINotificationFeedbackGenerator *generator = [UINotificationFeedbackGenerator new];
      [generator notificationOccurred:UINotificationFeedbackTypeSuccess];
      return;
    }
    case ButtonHapticTypeNotificationWarning: {
      static UINotificationFeedbackGenerator *generator = [UINotificationFeedbackGenerator new];
      [generator notificationOccurred:UINotificationFeedbackTypeWarning];
      return;
    }
    case ButtonHapticTypeImpactLight: {
      static UIImpactFeedbackGenerator *generator =
          [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
      [generator impactOccurred];
      return;
    }
    case ButtonHapticTypeImpactMedium: {
      static UIImpactFeedbackGenerator *generator =
          [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
      [generator impactOccurred];
      return;
    }
    case ButtonHapticTypeImpactHeavy: {
      static UIImpactFeedbackGenerator *generator =
          [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleHeavy];
      [generator impactOccurred];
      return;
    }
  }
}

static CGAffineTransform ScaleTransform(CGSize size, CGPoint origin, CGFloat scale)
{
  const CGFloat translationX = (1.0 - scale) * (origin.x - 0.5) * size.width;
  const CGFloat translationY = (1.0 - scale) * (origin.y - 0.5) * size.height;
  return CGAffineTransformMake(scale, 0, 0, scale, translationX, translationY);
}

@interface ButtonComponentView : RCTViewComponentView <RCTButtonViewProtocol>
@end

@interface ButtonComponentView ()
- (void)resetInteractionState;
@end

@implementation ButtonComponentView {
  UILongPressGestureRecognizer *_longPress;
  CGPoint _tapLocation;
  BOOL _hasTapLocation;
  UIViewPropertyAnimator *_animator;

  NSTimeInterval _durationSeconds;
  NSTimeInterval _pressOutDurationSeconds;
  CGFloat _scaleTo;
  BOOL _cancelEnabled;
  BOOL _enableHapticFeedback;
  ButtonHapticType _hapticType;
  BOOL _useLateHaptic;
  BOOL _throttle;
  BOOL _shouldLongPressHoldPress;
  BOOL _pressStartEnabled;
  CFTimeInterval _blockedUntil;
  BOOL _invalidated;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ButtonShadowNode::defaultSharedProps();
    const auto &defaultProps = static_cast<const ButtonProps &>(*_props);

    _durationSeconds = SecondsFromMilliseconds(defaultProps.duration);
    _pressOutDurationSeconds = OptionalSecondsFromMilliseconds(defaultProps.pressOutDuration);
    _scaleTo = defaultProps.scaleTo;
    _cancelEnabled = defaultProps.cancelEnabled;
    _enableHapticFeedback = defaultProps.enableHapticFeedback;
    _hapticType = ButtonHapticTypeFromString(defaultProps.hapticType);
    _useLateHaptic = defaultProps.useLateHaptic;
    _throttle = defaultProps.throttle;
    _shouldLongPressHoldPress = defaultProps.shouldLongPressHoldPress;
    _pressStartEnabled = defaultProps.pressStartEnabled;
    self.userInteractionEnabled = !defaultProps.disabled;

    [self resetInteractionState];
  }

  return self;
}

- (void)resetInteractionState
{
  [_animator stopAnimation:YES];
  _animator = nil;

  _blockedUntil = 0;
  _invalidated = NO;
  _hasTapLocation = NO;
  _tapLocation = CGPointZero;

  _longPress.enabled = NO;
  _longPress.enabled = YES;

  self.transform = CGAffineTransformIdentity;
}

- (void)prepareForRecycle
{
  [self resetInteractionState];
  const Props::Shared oldProps = _props;
  static const auto defaultProps = ButtonShadowNode::defaultSharedProps();
  [self updateProps:defaultProps oldProps:oldProps];
  [super prepareForRecycle];
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldButtonProps = static_cast<const ButtonProps &>(*_props);
  const auto &newButtonProps = static_cast<const ButtonProps &>(*props);

  if (newButtonProps.disabled != oldButtonProps.disabled) {
    self.userInteractionEnabled = !newButtonProps.disabled;
  }

  if (newButtonProps.duration != oldButtonProps.duration) {
    _durationSeconds = SecondsFromMilliseconds(newButtonProps.duration);
  }

  if (newButtonProps.pressOutDuration != oldButtonProps.pressOutDuration) {
    _pressOutDurationSeconds = OptionalSecondsFromMilliseconds(newButtonProps.pressOutDuration);
  }

  if (newButtonProps.scaleTo != oldButtonProps.scaleTo) {
    _scaleTo = newButtonProps.scaleTo;
  }

  if (newButtonProps.cancelEnabled != oldButtonProps.cancelEnabled) {
    _cancelEnabled = newButtonProps.cancelEnabled;
  }

  if (newButtonProps.enableHapticFeedback != oldButtonProps.enableHapticFeedback) {
    _enableHapticFeedback = newButtonProps.enableHapticFeedback;
  }

  if (newButtonProps.useLateHaptic != oldButtonProps.useLateHaptic) {
    _useLateHaptic = newButtonProps.useLateHaptic;
  }

  if (newButtonProps.throttle != oldButtonProps.throttle) {
    _throttle = newButtonProps.throttle;
  }

  if (newButtonProps.shouldLongPressHoldPress != oldButtonProps.shouldLongPressHoldPress) {
    _shouldLongPressHoldPress = newButtonProps.shouldLongPressHoldPress;
  }

  if (newButtonProps.pressStartEnabled != oldButtonProps.pressStartEnabled) {
    _pressStartEnabled = newButtonProps.pressStartEnabled;
  }

  if (newButtonProps.longPressGestureEnabled != oldButtonProps.longPressGestureEnabled) {
    if (newButtonProps.longPressGestureEnabled) {
      _longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(onLongPressHandler:)];
      _longPress.minimumPressDuration = SecondsFromMilliseconds(newButtonProps.minLongPressDuration);
      [self addGestureRecognizer:_longPress];
    } else {
      [self removeGestureRecognizer:_longPress];
      _longPress = nil;
    }
  } else if (_longPress && newButtonProps.minLongPressDuration != oldButtonProps.minLongPressDuration) {
    _longPress.minimumPressDuration = SecondsFromMilliseconds(newButtonProps.minLongPressDuration);
  }

  if (newButtonProps.hapticType != oldButtonProps.hapticType) {
    _hapticType = ButtonHapticTypeFromString(newButtonProps.hapticType);
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - Events

- (void)sendPressAtLocation:(CGPoint)location
{
  if (!_eventEmitter) {
    return;
  }

  ButtonEventEmitter::OnPress event = {
      .locationX = location.x,
      .locationY = location.y,
  };
  static_cast<const ButtonEventEmitter &>(*_eventEmitter).onPress(event);
}

- (void)sendPressStart
{
  if (!_pressStartEnabled || !_eventEmitter) {
    return;
  }

  static_cast<const ButtonEventEmitter &>(*_eventEmitter).onPressStart({});
}

- (void)sendLongPress
{
  if (!_eventEmitter) {
    return;
  }

  static_cast<const ButtonEventEmitter &>(*_eventEmitter).onLongPress({});
}

- (void)sendLongPressEnded
{
  if (!_eventEmitter) {
    return;
  }

  static_cast<const ButtonEventEmitter &>(*_eventEmitter).onLongPressEnded({});
}

- (void)sendCancelWithLongPressState:(UIGestureRecognizerState)longPressState close:(BOOL)close
{
  if (!_cancelEnabled || !_eventEmitter) {
    return;
  }

  static_cast<const ButtonEventEmitter &>(*_eventEmitter)
      .onCancel({
        .close = close,
        .longPressFailed = longPressState == UIGestureRecognizerStateFailed,
      });
}

#pragma mark - Touch handling

- (void)onLongPressHandler:(UILongPressGestureRecognizer *)sender
{
  if (!sender) {
    return;
  }

  switch (sender.state) {
    case UIGestureRecognizerStateBegan:
      [self sendLongPress];
      break;
    case UIGestureRecognizerStateEnded:
      if (_shouldLongPressHoldPress) {
        [self sendLongPressEnded];
        _animator = [self
            animateTapEndWithDuration:(_pressOutDurationSeconds == -1 ? _durationSeconds : _pressOutDurationSeconds)
                           hapticType:ButtonHapticTypeNone];
      }
      break;
    default:
      break;
  }
}

- (BOOL)isClose:(CGPoint)locationA to:(CGPoint)locationB
{
  if (fabs(locationA.x - locationB.x) > 5) {
    return NO;
  }

  if (fabs(locationA.y - locationB.y) > 5) {
    return NO;
  }

  return YES;
}

- (BOOL)touchInRange:(CGPoint)location tolerance:(CGFloat)tolerance
{
  if (!_hasTapLocation) {
    return NO;
  }
  return (
      _tapLocation.x - tolerance <= location.x && location.x <= _tapLocation.x + tolerance &&
      _tapLocation.y - tolerance <= location.y && location.y <= _tapLocation.y + tolerance);
}

- (UIViewPropertyAnimator *)animateTapStartWithDuration:(double)duration
                                                  scale:(double)scale
                                             hapticType:(ButtonHapticType)hapticType
{
  GenerateHapticFeedback(hapticType);

  const auto &buttonProps = static_cast<const ButtonProps &>(*_props);
  const CGPoint transformOrigin = buttonProps.transformOrigin.size() == 2
      ? CGPointMake(buttonProps.transformOrigin[0], buttonProps.transformOrigin[1])
      : CGPointMake(0.5, 0.5);

  UIViewPropertyAnimator *animator =
      [[UIViewPropertyAnimator alloc] initWithDuration:duration
                                         controlPoint1:CGPointMake(0.25, 0.46)
                                         controlPoint2:CGPointMake(0.45, 0.94)
                                            animations:^{
                                              self.transform = ScaleTransform(self.bounds.size, transformOrigin, scale);
                                            }];
  [animator startAnimation];
  return animator;
}

- (UIViewPropertyAnimator *)animateTapEndWithDuration:(double)duration hapticType:(ButtonHapticType)hapticType
{
  GenerateHapticFeedback(hapticType);

  UIViewPropertyAnimator *animator = [[UIViewPropertyAnimator alloc] initWithDuration:duration
                                                                        controlPoint1:CGPointMake(0.25, 0.46)
                                                                        controlPoint2:CGPointMake(0.45, 0.94)
                                                                           animations:^{
                                                                             self.transform = CGAffineTransformIdentity;
                                                                           }];
  [animator startAnimation];
  return animator;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  UITouch *touch = touches.anyObject;
  if (touch) {
    _tapLocation = [touch locationInView:self];
    _hasTapLocation = YES;
  }

  if (CACurrentMediaTime() < _blockedUntil) {
    _invalidated = YES;
    return;
  }

  _invalidated = NO;
  ButtonHapticType hapticType = !_useLateHaptic && _enableHapticFeedback ? _hapticType : ButtonHapticTypeNone;
  _animator = [self animateTapStartWithDuration:_durationSeconds scale:_scaleTo hapticType:hapticType];

  if (_shouldLongPressHoldPress) {
    [self sendPressAtLocation:_tapLocation];
  } else {
    [self sendPressStart];
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (_invalidated) {
    return;
  }

  UITouch *touch = touches.anyObject;
  if (!touch) {
    return;
  }

  CGPoint location = [touch locationInView:self];
  if (_animator.isRunning) {
    return;
  }

  static const CGFloat kTouchMoveTolerance = 80.0;
  if (![self touchInRange:location tolerance:kTouchMoveTolerance]) {
    _animator = [self animateTapEndWithDuration:_durationSeconds hapticType:ButtonHapticTypeNone];
  } else if ([self touchInRange:location tolerance:kTouchMoveTolerance * 0.8]) {
    _animator =
        [self animateTapStartWithDuration:_durationSeconds scale:_scaleTo hapticType:ButtonHapticTypeNone];
  }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (_invalidated) {
    return;
  }

  UITouch *touch = touches.anyObject;
  if (!touch) {
    return;
  }

  CGPoint location = [touch locationInView:self];
  static const CGFloat kTouchMoveTolerance = 80.0;
  if ([self touchInRange:location tolerance:kTouchMoveTolerance * 0.8]) {
    ButtonHapticType hapticType = _useLateHaptic && _enableHapticFeedback ? _hapticType : ButtonHapticTypeNone;
    _animator =
        [self animateTapEndWithDuration:(_pressOutDurationSeconds == -1 ? _durationSeconds : _pressOutDurationSeconds)
                             hapticType:hapticType];
    if (!_shouldLongPressHoldPress) {
      [self sendPressAtLocation:location];
    }
    if (_throttle) {
      _blockedUntil = CACurrentMediaTime() + kThrottleDurationSeconds;
    }
  } else {
    [self touchesCancelled:touches withEvent:event];
  }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (_invalidated) {
    return;
  }

  UITouch *touch = touches.anyObject;
  if (touch && _hasTapLocation) {
    CGPoint location = [touch locationInView:self];
    UIGestureRecognizerState longPressState = _longPress ? _longPress.state : UIGestureRecognizerStatePossible;
    [self sendCancelWithLongPressState:longPressState close:[self isClose:location to:_tapLocation]];
  }

  if (!_shouldLongPressHoldPress) {
    _animator =
        [self animateTapEndWithDuration:(_pressOutDurationSeconds == -1 ? _durationSeconds : _pressOutDurationSeconds)
                             hapticType:ButtonHapticTypeNone];
  }

  if (_throttle) {
    _blockedUntil = CACurrentMediaTime() + kThrottleDurationSeconds;
  }
}

@end
