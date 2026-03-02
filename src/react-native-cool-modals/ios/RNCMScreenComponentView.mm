//
//  RNCMScreenComponentView.mm
//  React Native Cool Modals
//

#import "RNCMScreenComponentView.h"

#import <React/RCTConversions.h>
#import <React/RCTViewComponentView.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTRootComponentView.h>
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

  _controller.modalInPresentation = !newScreenProps.gestureEnabled;
  switch (newScreenProps.stackPresentation) {
    case RNCMScreenStackPresentation::Push:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
    case RNCMScreenStackPresentation::Modal:
      _controller.modalPresentationStyle = UIModalPresentationAutomatic;
      if (_controller.transDelegate != nil) {
        _controller.modalPresentationStyle = UIModalPresentationCustom;
      }
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
    case facebook::react::RNCMScreenStackPresentation::FormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
  }

  switch (newScreenProps.stackAnimation) {
    case RNCMScreenStackAnimation::Default:
    case RNCMScreenStackAnimation::None:
      // Default
      break;
    case RNCMScreenStackAnimation::Fade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
    case RNCMScreenStackAnimation::Flip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
  }
    
    if (newScreenProps.hidden != oldScreenProps.hidden && newScreenProps.hidden) {
        dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC);
        dispatch_after(delay, dispatch_get_main_queue(), ^(void){
          if (self.superview.superview.subviews.count > 0) {
            self.superview.superview.subviews[0].backgroundColor = [UIColor.whiteColor colorWithAlphaComponent:0];
          }
          [(PanModalViewController*) [self->_controller parentVC] hide];
        });
      }

    
    [(PanModalViewController*) [_controller parentVC] rejump];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
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
    // when screen is mounted under RNSNavigationController it's size is controller
    // by the navigation controller itself. That is, it is set to fill space of
    // the controller. In that case we ignore react layout system from managing
    // the screen dimensions and we wait for the screen VC to update and then we
    // pass the dimensions to ui view manager to take into account when laying out
    // subviews
    // Explanation taken from `reactSetFrame`, which is old arch equivalent of this code.
}

- (void)layout
{
  [(PanModalViewController *)[_controller parentVC] panModalSetNeedsLayoutUpdateWrapper];
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

    _state->updateState(std::move(newState));

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
