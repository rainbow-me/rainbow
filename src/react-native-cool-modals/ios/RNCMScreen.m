#import <UIKit/UIKit.h>

#import "RNCMScreen.h"

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
    _showDragIndicator = true;
    _blocksBackgroundTouches = true;
    _headerHeight = [[NSNumber alloc] initWithInt:0];
    _shortFormHeight = [[NSNumber alloc] initWithInt:300];;
    _startFromShortForm = false;
    _modalBackgroundColor = [[UIColor alloc] initWithRed:0.0f green:0.0f blue:0.0f alpha:1];
    _backgroundOpacity = [[NSNumber alloc] initWithDouble:0.7];
    _dismissable = YES;
    _ignoreBottomOffset = NO;
    _interactWithScrollView = true;
    _hidden = false;
    _disableShortFormAfterTransitionToLongForm = false;
    _relevantScrollViewDepth = @1;
  }
  
  return self;
}

- (void)willDismiss {
  _onWillDismiss(nil);
}

- (void) setIsShortFormEnabled:(BOOL)isShortFormEnabled {
  _isShortFormEnabled = isShortFormEnabled;
  [(PanModalViewController*) [_controller parentVC] panModalSetNeedsLayoutUpdateWrapper];
  
}

- (void) layout {
  [(PanModalViewController*) [_controller parentVC] panModalSetNeedsLayoutUpdateWrapper];
}

- (void) setHidden:(BOOL)hidden {
  if (hidden) {
    _hidden = hidden;
    dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC);
    dispatch_after(delay, dispatch_get_main_queue(), ^(void){
      if (self.superview.superview.subviews.count > 0) {
        self.superview.superview.subviews[0].backgroundColor = [UIColor.whiteColor colorWithAlphaComponent:0];
      }
      [(PanModalViewController*) [_controller parentVC] hide];
    });
   
  }
}

- (void)jumpTo:(nonnull NSNumber*)point {
  [(PanModalViewController*) [_controller parentVC] jumpToLong:point];
}

-(void)setLongFormHeight:(NSNumber *)longFormHeight {
  _longFormHeight = longFormHeight;
  [(PanModalViewController*) [_controller parentVC] rejump];
}

-(void)setShortFormHeight:(NSNumber *)shortFormHeight {
  _shortFormHeight = shortFormHeight;
  [(PanModalViewController*) [_controller parentVC] rejump];
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
      // Default
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

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

- (void)notifyDismissed
{
  _dismissed = YES;
  if (self.onDismissed) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onDismissed) {
        self.onDismissed(nil);
      }
    });
  }
}

- (void)notifyAppear
{
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
  if (self.stackPresentation != RNSScreenStackPresentationModal) {
    _controller = nil;
  }
}

- (void)removeController {
  //_controller = nil;
}

@end

@implementation RNCMScreen {
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
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
  return [_parentVC dismissViewControllerAnimated:flag completion:completion];
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
  [_parentVC viewDidLayoutSubviews];
  
  if (!CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [((RNCMScreenView *)self.viewIfLoaded) updateBounds];
  }
}

- (id)findFirstResponder:(UIView*)parent
{
  if (parent.isFirstResponder) {
    return parent;
  }
  for (UIView *subView in parent.subviews) {
    id responder = [self findFirstResponder:subView];
    if (responder != nil) {
      return responder;
    }
  }
  return nil;
}

- (void)willMoveToParentViewController:(UIViewController *)parent
{
  [super willMoveToParentViewController:parent];
  if (parent == nil) {
    id responder = [self findFirstResponder:self.view];
    if (responder != nil) {
      _previousFirstResponder = responder;
    }
  }
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  if (self.parentViewController == nil && self.presentingViewController == nil) {
    [((RNCMScreenView *)self.view) notifyDismissed];
  }
  dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 1);
  dispatch_after(delay, dispatch_get_main_queue(), ^(void){
    _parentVC = nil;
  });
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
}

- (PanModalViewController*) parentVC {
  return (PanModalViewController*) _parentVC;
}

@end

@implementation RNCMScreenManager

RCT_EXPORT_METHOD(jumpTo:(nonnull NSNumber*)point tag:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RNCMScreenView class]]) {
      RCTLogError(@"Cannot find RNCMScreenView with tag #%@", reactTag);
      return;
    }
    [(RNCMScreenView *) view jumpTo:point];
  }];
  
}

RCT_EXPORT_METHOD(layout:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RNCMScreenView class]]) {
      RCTLogError(@"Cannot find RNCMScreenView with tag #%@", reactTag);
      return;
    }
    [(RNCMScreenView *) view layout];
  }];
  
}


RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showDragIndicator, BOOL)
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
RCT_EXPORT_VIEW_PROPERTY(springDamping, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(transitionDuration, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(modalBackgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundOpacity, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(longFormHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(headerHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(shortFormHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(relevantScrollViewDepth, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(isShortFormEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(blocksBackgroundTouches, BOOL)
RCT_EXPORT_VIEW_PROPERTY(anchorModalToLongForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(disableShortFormAfterTransitionToLongForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(allowsTapToDismiss, BOOL)
RCT_EXPORT_VIEW_PROPERTY(allowsDragToDismiss, BOOL)
RCT_EXPORT_VIEW_PROPERTY(startFromShortForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(ignoreBottomOffset, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hidden, BOOL)


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

