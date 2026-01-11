//
//  ButtonComponentView.mm
//  Rainbow
//

#import <React/RCTConversions.h>
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/rainbow/ComponentDescriptors.h>
#import <react/renderer/components/rainbow/EventEmitters.h>
#import <react/renderer/components/rainbow/Props.h>
#import <react/renderer/components/rainbow/RCTComponentViewHelpers.h>

using namespace facebook::react;

static void GenerateHapticFeedback(NSString *hapticEffect)
{
  if (!hapticEffect) {
    return;
  }

  if ([hapticEffect isEqualToString:@"error"] ||
      [hapticEffect isEqualToString:@"notificationError"]) {
    UINotificationFeedbackGenerator *generator = [UINotificationFeedbackGenerator new];
    [generator notificationOccurred:UINotificationFeedbackTypeError];
    return;
  }

  if ([hapticEffect isEqualToString:@"success"] ||
      [hapticEffect isEqualToString:@"notificationSuccess"]) {
    UINotificationFeedbackGenerator *generator = [UINotificationFeedbackGenerator new];
    [generator notificationOccurred:UINotificationFeedbackTypeSuccess];
    return;
  }

  if ([hapticEffect isEqualToString:@"warning"] ||
      [hapticEffect isEqualToString:@"notificationWarning"]) {
    UINotificationFeedbackGenerator *generator = [UINotificationFeedbackGenerator new];
    [generator notificationOccurred:UINotificationFeedbackTypeWarning];
    return;
  }

  if ([hapticEffect isEqualToString:@"light"] ||
      [hapticEffect isEqualToString:@"impactLight"]) {
    UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
    [generator impactOccurred];
    return;
  }

  if ([hapticEffect isEqualToString:@"medium"] ||
      [hapticEffect isEqualToString:@"impactMedium"]) {
    UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
    [generator impactOccurred];
    return;
  }

  if ([hapticEffect isEqualToString:@"heavy"] ||
      [hapticEffect isEqualToString:@"impactHeavy"]) {
    UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleHeavy];
    [generator impactOccurred];
    return;
  }

  UISelectionFeedbackGenerator *generator = [UISelectionFeedbackGenerator new];
  [generator selectionChanged];
}

static void SetAnchorPoint(UIView *view, CGPoint point)
{
  CGPoint newPoint = CGPointMake(view.bounds.size.width * point.x, view.bounds.size.height * point.y);
  CGPoint oldPoint = CGPointMake(view.bounds.size.width * view.layer.anchorPoint.x, view.bounds.size.height * view.layer.anchorPoint.y);

  newPoint = CGPointApplyAffineTransform(newPoint, view.transform);
  oldPoint = CGPointApplyAffineTransform(oldPoint, view.transform);

  CGPoint position = view.layer.position;
  position.x -= oldPoint.x;
  position.x += newPoint.x;

  position.y -= oldPoint.y;
  position.y += newPoint.y;

  view.layer.position = position;
  view.layer.anchorPoint = point;
}

@interface ButtonComponentView : RCTViewComponentView <RCTButtonViewProtocol>
@end

@implementation ButtonComponentView {
  UILongPressGestureRecognizer *_longPress;
  CGPoint _tapLocation;
  BOOL _hasTapLocation;
  UIViewPropertyAnimator *_animator;

  double _duration;
  double _pressOutDuration;
  double _scaleTo;
  BOOL _enableHapticFeedback;
  NSString *_hapticType;
  BOOL _useLateHaptic;
  BOOL _throttle;
  BOOL _shouldLongPressHoldPress;
  BOOL _blocked;
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

    _duration = 0.16;
    _pressOutDuration = -1.0;
    _scaleTo = 0.97;
    _enableHapticFeedback = YES;
    _hapticType = @"selection";
    _useLateHaptic = YES;
    _throttle = NO;
    _shouldLongPressHoldPress = NO;
    _blocked = NO;
    _invalidated = NO;

    self.isAccessibilityElement = YES;
    self.userInteractionEnabled = YES;
    SetAnchorPoint(self, CGPointMake(0.5, 0.5));

    _longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(onLongPressHandler:)];
    _longPress.minimumPressDuration = 0.5;
    [self addGestureRecognizer:_longPress];
  }

  return self;
}

- (void)prepareForRecycle
{
  _blocked = NO;
  _invalidated = NO;
  [super prepareForRecycle];
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldButtonProps = *std::static_pointer_cast<const ButtonProps>(_props);
  const auto &newButtonProps = *std::static_pointer_cast<const ButtonProps>(props);

  if (newButtonProps.disabled != oldButtonProps.disabled) {
    self.userInteractionEnabled = !newButtonProps.disabled;
  }

  if (newButtonProps.duration != oldButtonProps.duration) {
    _duration = newButtonProps.duration;
  }

  if (newButtonProps.pressOutDuration != oldButtonProps.pressOutDuration) {
    _pressOutDuration = newButtonProps.pressOutDuration;
  }

  if (newButtonProps.scaleTo != oldButtonProps.scaleTo) {
    _scaleTo = newButtonProps.scaleTo;
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

  if (newButtonProps.minLongPressDuration != oldButtonProps.minLongPressDuration) {
    _longPress.minimumPressDuration = newButtonProps.minLongPressDuration;
  }

  if (newButtonProps.hapticType != oldButtonProps.hapticType) {
    _hapticType = RCTNSStringFromString(newButtonProps.hapticType);
  }

  if (newButtonProps.transformOrigin != oldButtonProps.transformOrigin) {
    CGPoint origin = CGPointMake(newButtonProps.transformOrigin[0], newButtonProps.transformOrigin[1]);
    SetAnchorPoint(self, origin);
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
  std::dynamic_pointer_cast<const ButtonEventEmitter>(_eventEmitter)->onPress(event);
}

- (void)sendPressStart
{
  if (!_eventEmitter) {
    return;
  }

  std::dynamic_pointer_cast<const ButtonEventEmitter>(_eventEmitter)->onPressStart({});
}

- (void)sendLongPress
{
  if (!_eventEmitter) {
    return;
  }

  std::dynamic_pointer_cast<const ButtonEventEmitter>(_eventEmitter)->onLongPress({});
}

- (void)sendLongPressEnded
{
  if (!_eventEmitter) {
    return;
  }

  std::dynamic_pointer_cast<const ButtonEventEmitter>(_eventEmitter)->onLongPressEnded({});
}

- (void)sendCancelWithState:(UIGestureRecognizerState)state close:(BOOL)close
{
  if (!_eventEmitter) {
    return;
  }

  std::dynamic_pointer_cast<const ButtonEventEmitter>(_eventEmitter)->onCancel({
      .state = static_cast<int>(state),
      .close = close,
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
        _animator = [self animateTapEndWithDuration:(_pressOutDuration == -1 ? _duration : _pressOutDuration) useHaptic:nil];
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
  return (_tapLocation.x - tolerance <= location.x && location.x <= _tapLocation.x + tolerance &&
          _tapLocation.y - tolerance <= location.y && location.y <= _tapLocation.y + tolerance);
}

- (UIViewPropertyAnimator *)animateTapStartWithDuration:(double)duration
                                                  scale:(double)scale
                                               useHaptic:(NSString *)useHaptic
{
  if (useHaptic) {
    GenerateHapticFeedback(useHaptic);
  }

  UIViewPropertyAnimator *animator = [[UIViewPropertyAnimator alloc] initWithDuration:duration
                                                                       controlPoint1:CGPointMake(0.25, 0.46)
                                                                       controlPoint2:CGPointMake(0.45, 0.94)
                                                                          animations:^{
                                                                            self.transform = CGAffineTransformMakeScale(scale, scale);
                                                                          }];
  [animator startAnimation];
  return animator;
}

- (UIViewPropertyAnimator *)animateTapEndWithDuration:(double)duration
                                         useHaptic:(NSString *)useHaptic
{
  if (useHaptic) {
    GenerateHapticFeedback(useHaptic);
  }

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

  if (_blocked) {
    _invalidated = YES;
    return;
  }

  _invalidated = NO;
  NSString *haptic = (_useLateHaptic ? nil : (_enableHapticFeedback ? _hapticType : nil));
  _animator = [self animateTapStartWithDuration:_duration scale:_scaleTo useHaptic:haptic];

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
    _animator = [self animateTapEndWithDuration:_duration useHaptic:nil];
  } else if ([self touchInRange:location tolerance:kTouchMoveTolerance * 0.8]) {
    _animator = [self animateTapStartWithDuration:_duration scale:_scaleTo useHaptic:nil];
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
    NSString *useHaptic = (_useLateHaptic && _enableHapticFeedback) ? _hapticType : nil;
    _animator = [self animateTapEndWithDuration:(_pressOutDuration == -1 ? _duration : _pressOutDuration)
                                      useHaptic:useHaptic];
    if (!_shouldLongPressHoldPress) {
      [self sendPressAtLocation:location];
    }
    if (_throttle) {
      _blocked = YES;
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
          self->_blocked = NO;
      });
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
    [self sendCancelWithState:_longPress.state close:[self isClose:location to:_tapLocation]];
  }

  if (!_shouldLongPressHoldPress) {
    _animator = [self animateTapEndWithDuration:(_pressOutDuration == -1 ? _duration : _pressOutDuration)
                                      useHaptic:nil];
  }

  if (_throttle) {
    _blocked = YES;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      self->_blocked = NO;
    });
  }
}

@end
