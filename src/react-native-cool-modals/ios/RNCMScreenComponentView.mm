//
//  RNCMScreenComponentView.mm
//  React Native Cool Modals
//

#import "RNCMScreenComponentView.h"

#import <React/RCTConversions.h>
#import <React/RCTRootComponentView.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTViewComponentView.h>
#import <React/UIView+React.h>
#import <react/renderer/components/react_native_cool_modals/EventEmitters.h>
#import <react/renderer/components/react_native_cool_modals/Props.h>
#import <react/renderer/components/react_native_cool_modals/RCTComponentViewHelpers.h>
#import <react/renderer/components/react_native_cool_modals/RNCMScreenComponentDescriptor.h>
#import <react/renderer/components/react_native_cool_modals/RNCMScreenState.h>

#import "RNCMScreenViewController.h"
#import "RNCMTouchHandler.h"

using namespace facebook::react;

static inline const RNCMScreenProps &GetScreenComponentViewProps(const std::shared_ptr<const void> &props)
{
  return *std::static_pointer_cast<const RNCMScreenProps>(props);
}

@interface RNCMScreenComponentView () <UIAdaptivePresentationControllerDelegate, RCTRNCMScreenViewProtocol>
@end

@implementation RNCMScreenComponentView {
  RNCMScreenViewController *_controller;
  RNCMScreenShadowNode::ConcreteState::Shared _state;
  RCTSurfaceTouchHandler *_touchHandler;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNCMScreenComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = RNCMScreenShadowNode::defaultSharedProps();
    _controller = [[RNCMScreenViewController alloc] initWithView:self];
    _dismissed = NO;
  }
  return self;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldScreenProps = *std::static_pointer_cast<const RNCMScreenProps>(_props);
  const auto &newScreenProps = *std::static_pointer_cast<const RNCMScreenProps>(props);

  [super updateProps:props oldProps:oldProps];

  if (newScreenProps.gestureEnabled != oldScreenProps.gestureEnabled) {
    _controller.modalInPresentation = !newScreenProps.gestureEnabled;
  }

  if (newScreenProps.stackPresentation != oldScreenProps.stackPresentation) {
    switch (newScreenProps.stackPresentation) {
      case RNCMScreenStackPresentation::Push:
        // ignored, we only need to keep in mind not to set presentation delegate
        break;
      case RNCMScreenStackPresentation::Modal:
        _controller.modalPresentationStyle =
            _controller.transDelegate == nil ? UIModalPresentationAutomatic : UIModalPresentationCustom;
        break;
      case RNCMScreenStackPresentation::TransparentModal:
        _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
        break;
      case RNCMScreenStackPresentation::ContainedModal:
        _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
        break;
      case RNCMScreenStackPresentation::ContainedTransparentModal:
        _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
        break;
      case RNCMScreenStackPresentation::FullScreenModal:
        _controller.modalPresentationStyle = UIModalPresentationFullScreen;
        break;
      case RNCMScreenStackPresentation::FormSheet:
        _controller.modalPresentationStyle = UIModalPresentationFormSheet;
        break;
    }
  }

  if (newScreenProps.stackAnimation != oldScreenProps.stackAnimation) {
    switch (newScreenProps.stackAnimation) {
      case RNCMScreenStackAnimation::Default:
      case RNCMScreenStackAnimation::None:
        _controller.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
        break;
      case RNCMScreenStackAnimation::Fade:
        _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
        break;
      case RNCMScreenStackAnimation::Flip:
        _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
        break;
    }
  }

  if (newScreenProps.hidden != oldScreenProps.hidden && newScreenProps.hidden) {
    __weak RNCMScreenComponentView *weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), dispatch_get_main_queue(), ^{
      RNCMScreenComponentView *strongSelf = weakSelf;
      if (strongSelf == nil || !GetScreenComponentViewProps(strongSelf->_props).hidden) {
        return;
      }

      if (strongSelf.superview.superview.subviews.count > 0) {
        strongSelf.superview.superview.subviews[0].backgroundColor = [UIColor.whiteColor colorWithAlphaComponent:0];
      }
      [(PanModalViewController *)[strongSelf->_controller parentVC] hide];
    });
  }

  PanModalViewController *parentViewController = (PanModalViewController *)[_controller parentVC];
  if (newScreenProps.longFormHeight != oldScreenProps.longFormHeight ||
      newScreenProps.shortFormHeight != oldScreenProps.shortFormHeight) {
    [parentViewController rejump];
  } else if (newScreenProps.isShortFormEnabled != oldScreenProps.isShortFormEnabled) {
    [parentViewController panModalSetNeedsLayoutUpdateWrapper];
  }
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  _state = std::static_pointer_cast<const RNCMScreenShadowNode::ConcreteState>(state);
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  _newLayoutMetrics = layoutMetrics;
  _oldLayoutMetrics = oldLayoutMetrics;
  UIViewController *parentVC = self.reactViewController.parentViewController;
  if (parentVC == nil || ![parentVC isKindOfClass:[UINavigationController class]]) {
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  }
  // When a screen is mounted under UINavigationController, the navigation controller owns its size.
  // Ignore React layout for the screen itself and let the controller report its dimensions to the
  // shadow tree so React can lay out the screen's children.
}

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController
{
  return GetScreenComponentViewProps(_props).gestureEnabled;
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if ([_reactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_reactSuperview performSelector:@selector(presentationControllerDidDismiss:) withObject:presentationController];
  }
}

- (UIViewController *)reactViewController
{
  return _controller;
}

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

- (void)notifyWillAppear
{
  [self updateLayoutMetrics:_newLayoutMetrics oldLayoutMetrics:_oldLayoutMetrics];
}

- (void)notifyDismissed
{
  _dismissed = YES;
  auto eventEmitter = [self screenEventEmitter];
  if (eventEmitter) {
    eventEmitter->onDismissed({});
  }
}

- (void)notifyAppear
{
  auto eventEmitter = [self screenEventEmitter];
  if (eventEmitter) {
    eventEmitter->onAppear({});
  }
}

- (BOOL)isMountedUnderScreenOrReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[RCTRootComponentView class]] || [parent isKindOfClass:[RNCMScreenComponentView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For RN touches to work we need to instantiate and connect RCTSurfaceTouchHandler. This only applies
  // for screens that aren't mounted under RCTRootComponentView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [RCTSurfaceTouchHandler new];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (nullable RCTSurfaceTouchHandler *)touchHandler
{
  if (_touchHandler != nil) {
    return _touchHandler;
  }

  return [self rncm_findTouchHandlerInAncestorChain];
}

- (void)updateBounds
{
  if (_state != nullptr) {
    auto newState = RNCMScreenState{RCTSizeFromCGSize(self.bounds.size), {0, 0}};

    _state->updateState(std::move(newState), EventQueue::UpdateMode::unstable_Immediate);

    // TODO: Requesting layout on every layout is wrong. We should look for a way to get rid of this.
    UINavigationController *navctr = _controller.navigationController;
    [navctr.view setNeedsLayout];
  }
}

- (std::shared_ptr<const RNCMScreenEventEmitter>)screenEventEmitter
{
  if (!_eventEmitter) {
    return nullptr;
  }

  assert(std::dynamic_pointer_cast<const RNCMScreenEventEmitter>(_eventEmitter));
  return std::static_pointer_cast<const RNCMScreenEventEmitter>(_eventEmitter);
}

- (BOOL)allowsDragToDismiss
{
  return GetScreenComponentViewProps(_props).allowsDragToDismiss;
}

- (BOOL)allowsTapToDismiss
{
  return GetScreenComponentViewProps(_props).allowsTapToDismiss;
}

- (BOOL)anchorModalToLongForm
{
  return GetScreenComponentViewProps(_props).anchorModalToLongForm;
}

- (NSNumber *)backgroundOpacity
{
  return @(GetScreenComponentViewProps(_props).backgroundOpacity);
}

- (NSNumber *)cornerRadius
{
  return @(GetScreenComponentViewProps(_props).cornerRadius);
}

- (BOOL)customStack
{
  return GetScreenComponentViewProps(_props).customStack;
}

- (BOOL)disableShortFormAfterTransitionToLongForm
{
  return GetScreenComponentViewProps(_props).disableShortFormAfterTransitionToLongForm;
}

- (BOOL)interactWithScrollView
{
  return GetScreenComponentViewProps(_props).interactWithScrollView;
}

- (BOOL)isShortFormEnabled
{
  return GetScreenComponentViewProps(_props).isShortFormEnabled;
}

- (NSNumber *)longFormHeight
{
  return @(GetScreenComponentViewProps(_props).longFormHeight);
}

- (UIColor *)modalBackgroundColor
{
  return RCTUIColorFromSharedColor(GetScreenComponentViewProps(_props).modalBackgroundColor);
}

- (NSNumber *)relevantScrollViewDepth
{
  return @(GetScreenComponentViewProps(_props).relevantScrollViewDepth);
}

- (NSNumber *)shortFormHeight
{
  return @(GetScreenComponentViewProps(_props).shortFormHeight);
}

- (BOOL)showDragIndicator
{
  return GetScreenComponentViewProps(_props).showDragIndicator;
}

- (NSNumber *)springDamping
{
  return @(GetScreenComponentViewProps(_props).springDamping);
}

- (BOOL)startFromShortForm
{
  return GetScreenComponentViewProps(_props).startFromShortForm;
}

- (BOOL)ignoreBottomOffset
{
  return GetScreenComponentViewProps(_props).ignoreBottomOffset;
}

- (NSNumber *)topOffset
{
  return @(GetScreenComponentViewProps(_props).topOffset);
}

- (NSNumber *)transitionDuration
{
  return @(GetScreenComponentViewProps(_props).transitionDuration);
}

- (NSNumber *)headerHeight
{
  return @(GetScreenComponentViewProps(_props).headerHeight);
}

- (BOOL)dismissable
{
  return GetScreenComponentViewProps(_props).dismissable;
}

- (BOOL)hiddenModal
{
  return GetScreenComponentViewProps(_props).hidden;
}

- (RNCMScreenStackAnimation)stackAnimation
{
  return GetScreenComponentViewProps(_props).stackAnimation;
}

- (RNCMScreenStackPresentation)stackPresentation
{
  return GetScreenComponentViewProps(_props).stackPresentation;
}

- (BOOL)gestureEnabled
{
  return GetScreenComponentViewProps(_props).gestureEnabled;
}

- (PanModalViewController *)panModalViewController
{
  return (PanModalViewController *)((RNCMScreenViewController *)[self reactViewController]).parentVC;
}

- (void)willDismiss
{
  auto eventEmitter = [self screenEventEmitter];
  if (eventEmitter) {
    eventEmitter->onWillDismiss({});
  }
}

- (void)onTouchTopWrapper:(NSNumber *)dismissing
{
  auto eventEmitter = [self screenEventEmitter];
  if (eventEmitter) {
    eventEmitter->onTouchTop({.dismissing = dismissing.boolValue});
  }
}

- (void)invalidateImpl
{
  _controller = nil;
}

@end
