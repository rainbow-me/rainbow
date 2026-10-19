#import <UIKit/UIKit.h>

#import "RNCMScreen.h"
#import "RNCMScreenStack.h"

#import <React/RCTUIManager.h>
#import <React/RCTShadowView.h>
#import <React/RCTTouchHandler.h>

// lib
#import "Rainbow-Swift.h"

@interface RNCMScreenView () <UIAdaptivePresentationControllerDelegate, RCTInvalidating>
@end

@implementation RNCMScreenView {
  __weak RCTBridge *_bridge;
  RNCMScreen *_controller;
  RCTTouchHandler *_touchHandler;
  NSNumber *_dismissalRequest;
  BOOL _presentationChanged;
  BOOL _layoutChanged;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[RNCMScreen alloc] initWithView:self];
    _stackPresentation = RNSScreenStackPresentationPush;
    _stackAnimation = RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _dismissed = NO;
    
    _startFromShortForm = false;
    _topOffset = [[NSNumber alloc] initWithInt: 42];
    _isShortFormEnabled = false;
    _longFormHeight = [[NSNumber alloc] initWithDouble:UIScreen.mainScreen.bounds.size.height];
    _cornerRadius = [[NSNumber alloc] initWithInt: 8.0];
    _springDamping = [[NSNumber alloc] initWithDouble: 0.8];
    _transitionDuration = [[NSNumber alloc] initWithDouble: 0.5];
    _anchorModalToLongForm = false;
    _allowsDragToDismiss = true;
    _allowsTapToDismiss = true;
    _inStack = YES;
    _headerHeight = [[NSNumber alloc] initWithInt:0];
    _shortFormHeight = [[NSNumber alloc] initWithInt:300];;
    _startFromShortForm = false;
    _modalBackgroundColor = [[UIColor alloc] initWithRed:0.0f green:0.0f blue:0.0f alpha:1];
    _backgroundOpacity = [[NSNumber alloc] initWithDouble:0.7];
    _dismissable = YES;
    _ignoreBottomOffset = NO;
    _interactWithScrollView = true;
    _disableShortFormAfterTransitionToLongForm = false;
  }
  
  return self;
}

- (void)willDismiss {
  _dismissalRequest = @(_presentationRequest);
  if (_onWillDismiss) {
    _onWillDismiss(nil);
  }
  [(RNCMScreenStackView *)_reactSuperview setNeedsContainerUpdate];
}

- (void)setPresentationRequest:(NSInteger)presentationRequest {
  if (_presentationRequest == presentationRequest) return;
  _presentationRequest = presentationRequest;
  _presentationChanged = YES;
}

- (void)setIsShortFormEnabled:(BOOL)isShortFormEnabled {
  if (_isShortFormEnabled == isShortFormEnabled) return;
  _isShortFormEnabled = isShortFormEnabled;
  _layoutChanged = YES;
}

- (void)setLongFormHeight:(NSNumber *)height {
  if ([_longFormHeight isEqualToNumber:height]) return;
  _longFormHeight = height;
  _layoutChanged = YES;
}

- (void)setShortFormHeight:(NSNumber *)height {
  if ([_shortFormHeight isEqualToNumber:height]) return;
  _shortFormHeight = height;
  _layoutChanged = YES;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps {
  [super didSetProps:changedProps];
  [(RNCMScreenStackView *)_reactSuperview setNeedsContainerUpdate];
}

- (void)applyConfiguration {
  PanModalViewController *presenter = (PanModalViewController *)[_controller parentVC];
  BOOL restore = _presentationChanged && _inStack;
  if (_presentationChanged) {
    _dismissed = NO;
    _skipsOnReturn = NO;
  }
  if (_skipsOnReturn && !_limitActiveModals) {
    _skipsOnReturn = NO;
    restore = _inStack;
  }
  if (restore) {
    [presenter restorePresentation];
  } else if (_inStack && !_skipsOnReturn && !presenter.dismissing && !presenter.hiding) {
    if (_layoutChanged) [presenter panModalSetNeedsLayoutUpdateWrapper];
  }
  _presentationChanged = NO;
  _layoutChanged = NO;
}

- (void)onTouchTopWrapper:(NSNumber*)dismissing {
  if (_onTouchTop) {
    _onTouchTop(@{ @"dismissing": dismissing });
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  if (![self.reactViewController.parentViewController
        isKindOfClass:[UINavigationController class]]) {
    [super reactSetFrame:frame];
  }
  // when screen is mounted under UINavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore react layout system from managing
  // the screen dimentions and we wait for the screen VC to update and then we
  // pass the dimentions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)reactViewController
{
  return _controller;
}

- (void)updateBounds
{
  [_bridge.uiManager setSize:self.bounds.size forView:self];
}

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via React props
}

- (void)setStackPresentation:(RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case RNSScreenStackPresentationModal:
      _controller.modalPresentationStyle = UIModalPresentationAutomatic;
      if (_controller.transDelegate != nil) {
        _controller.modalPresentationStyle = UIModalPresentationCustom;
      }
      break;
    case RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
    case RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
    case RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    //_controller.presentationController.delegate = self;
  } else if (_stackPresentation != RNSScreenStackPresentationPush) {
    RCTLogError(@"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;
  
  switch (stackAnimation) {
    case RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
    case RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
    case RNSScreenStackAnimationNone:
    case RNSScreenStackAnimationDefault:
      _controller.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
      break;
  }
}

- (void)setGestureEnabled:(BOOL)gestureEnabled
{
  _controller.modalInPresentation = !gestureEnabled;
  _gestureEnabled = gestureEnabled;
}

- (UIView *)reactSuperview
{
  return _reactSuperview;
}

//- (void)addSubview:(UIView *)view
//{
//  if (![view isKindOfClass:[RNCMScreenStackHeaderConfig class]]) {
//    [super addSubview:view];
//  } else {
//    ((RNCMScreenStackHeaderConfig*) view).screenView = self;
//  }
//}

- (void)notifyDismissed
{
  if (_dismissed) return;
  NSNumber *request = _dismissalRequest ?: @(_presentationRequest);
  _dismissalRequest = nil;
  _dismissed = request.integerValue == _presentationRequest;
  if (self.onDismissed) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onDismissed) {
        self.onDismissed(@{ @"presentationRequest": request });
      }
    });
  }
}

- (void)notifyAppear
{
  _dismissalRequest = nil;
  [(RNCMScreenStackView *)_reactSuperview setNeedsContainerUpdate];
  if (self.onAppear) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onAppear) {
        self.onAppear(nil);
      }
    });
  }
}

- (BOOL)isMountedUnderScreenOrReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[RCTRootView class]] || [parent isKindOfClass:[RNCMScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For RN touches to work we need to instantiate and connect RCTTouchHandler. This only applies
  // for screens that aren't mounted under RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
  [_touchHandler cancel];
  [_touchHandler reset];
}

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController
{
  return _gestureEnabled;
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if ([_reactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_reactSuperview performSelector:@selector(presentationControllerDidDismiss:)
                          withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation RNCMScreen {
  CGSize _lastViewSize;
  UIViewController *_parentVC;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    self.view = view;
    self.transDelegate = [self obtainDelegate];
    if (self.transDelegate != nil) {
      self.transitioningDelegate = self.transDelegate;
      self.modalPresentationStyle = UIModalPresentationCustom;
    }
  }
  return self;
}

- (void)presentModally:(UIViewController *)viewControllerToPresent animated:(BOOL)flag completion:(void (^)(void))completion  slackStack:(BOOL)slackStack {
  return [_parentVC presentModally:viewControllerToPresent animated:flag completion:completion slackStack:slackStack];
}

- (void)dismissViewControllerAnimated:(BOOL)flag completion:(void (^)(void))completion {
  if (self.parentViewController) {
    [self.parentViewController dismissViewControllerAnimated:flag completion:completion];
  } else {
    [super dismissViewControllerAnimated:flag completion:completion];
  }
}

- (UIViewController *)presentedViewController {
  return [_parentVC presentedViewController];
}

- (UIViewController *)presentingViewController {
  return [_parentVC presentingViewController];
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  
  if (!CGSizeEqualToSize(_lastViewSize, self.view.bounds.size)) {
    _lastViewSize = self.view.bounds.size;
    [((RNCMScreenView *)self.viewIfLoaded) updateBounds];
  }
}

- (void)presentViewController:(UIViewController *)viewControllerToPresent animated:(BOOL)flag completion:(void (^)(void))completion {
  BOOL isContextMenu = [viewControllerToPresent isKindOfClass:NSClassFromString(@"_UIContextMenuActionsOnlyViewController")];
  
  if (isContextMenu) {
    [_parentVC presentViewController:viewControllerToPresent animated:flag completion:completion];
  } else {
    [super presentViewController:viewControllerToPresent animated:flag completion:completion];
  }
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  RNCMScreenView *screen = (RNCMScreenView *)self.view;
  if (screen.stackPresentation == RNSScreenStackPresentationPush &&
      self.parentViewController == nil && self.presentingViewController == nil) {
    [screen notifyDismissed];
  }
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
}

- (PanModalViewController*) parentVC {
  return (PanModalViewController*) _parentVC;
}

@end

@implementation RNCMScreenManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(customStack, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dismissable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(interactWithScrollView, BOOL)
RCT_EXPORT_VIEW_PROPERTY(topOffset, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(stackPresentation, RNSScreenStackPresentation)
RCT_EXPORT_VIEW_PROPERTY(stackAnimation, RNSScreenStackAnimation)
RCT_EXPORT_VIEW_PROPERTY(onAppear, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onDismissed, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTouchTop, RCTDirectEventBlock)

RCT_EXPORT_VIEW_PROPERTY(onWillDismiss, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(presentationRequest, NSInteger);
RCT_EXPORT_VIEW_PROPERTY(springDamping, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(transitionDuration, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(modalBackgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundOpacity, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(longFormHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(headerHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(shortFormHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(isShortFormEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(anchorModalToLongForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(disableShortFormAfterTransitionToLongForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(allowsTapToDismiss, BOOL)
RCT_EXPORT_VIEW_PROPERTY(allowsDragToDismiss, BOOL)
RCT_EXPORT_VIEW_PROPERTY(startFromShortForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(ignoreBottomOffset, BOOL)
RCT_EXPORT_VIEW_PROPERTY(inStack, BOOL)
RCT_EXPORT_VIEW_PROPERTY(limitActiveModals, BOOL)

- (UIView *)view
{
  return [[RNCMScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation RCTConvert (RNSScreen)

RCT_ENUM_CONVERTER(RNSScreenStackPresentation, (@{
  @"push": @(RNSScreenStackPresentationPush),
  @"modal": @(RNSScreenStackPresentationModal),
  @"fullScreenModal": @(RNSScreenStackPresentationFullScreenModal),
  @"formSheet": @(RNSScreenStackPresentationFormSheet),
  @"containedModal": @(RNSScreenStackPresentationContainedModal),
  @"transparentModal": @(RNSScreenStackPresentationTransparentModal),
  @"containedTransparentModal": @(RNSScreenStackPresentationContainedTransparentModal)
}), RNSScreenStackPresentationPush, integerValue)

RCT_ENUM_CONVERTER(RNSScreenStackAnimation, (@{
  @"default": @(RNSScreenStackAnimationDefault),
  @"none": @(RNSScreenStackAnimationNone),
  @"fade": @(RNSScreenStackAnimationFade),
  @"flip": @(RNSScreenStackAnimationFlip),
}), RNSScreenStackAnimationDefault, integerValue)

@end
