#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTViewManager.h>
#import <React/RCTShadowView.h>
#import <React/RCTView.h>
#import <objc/runtime.h>
#import "Rainbow-Swift.h"

@interface HelperView : UIView
@end

@implementation HelperView {
  __weak RCTBridge *_bridge;
}

- (void)displayLayer:(CALayer*) layer {
  // shrug
}
- (void)setBridge:(RCTBridge *)bridge {
  _bridge = bridge;
}

- (void)reactSetFrame:(CGRect)frame {
  // shrug
}

- (void)setSpecialBounds:(CGRect)bounds {
  [self setBounds:bounds];
  [[_bridge uiManager] setSize:bounds.size forView:self];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [[_bridge uiManager] setSize:self.frame.size forView:self];
}
@end

@interface InvisibleView: RCTView
- (void)jumpTo:(NSNumber*)longForm;
@property (nonatomic, nonnull) NSNumber *topOffset;
@property (nonatomic) BOOL isShortFormEnabled;
@property (nonatomic, nullable) NSNumber *longFormHeight;
@property (nonatomic, nonnull) NSNumber *cornerRadius;
@property (nonatomic, nonnull) NSNumber *springDamping;
@property (nonatomic, nonnull) NSNumber *transitionDuration;
@property (nonatomic, nonnull) UIColor *backgroundColor;
@property (nonatomic, nonnull) NSNumber *backgroundOpacity;
@property (nonatomic) BOOL anchorModalToLongForm;
@property (nonatomic) BOOL allowsDragToDismiss;
@property (nonatomic) BOOL allowsTapToDismiss;
@property (nonatomic) BOOL isUserInteractionEnabled;
@property (nonatomic) BOOL isHapticFeedbackEnabled;
@property (nonatomic) BOOL shouldRoundTopCorners;
@property (nonatomic) BOOL showDragIndicator;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) BOOL blocksBackgroundTouches;
@property (nonatomic) BOOL interactsWithOuterScrollView;
@property (nonatomic) BOOL presentGlobally;
@property (nonatomic) BOOL initialAnimation;
@property (nonatomic) BOOL unmountAnimation;
@property (nonatomic, nonnull) NSNumber *headerHeight;
@property (nonatomic, nonnull) NSNumber *shortFormHeight;
@property (nonatomic) BOOL startFromShortForm;
@property (nonatomic) BOOL scrollsToTop;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onWillTransition;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onWillDismiss;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onDidDismiss;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onCrossMagicBorder;
@end

@implementation InvisibleView {
  __weak RCTBridge *_bridge;
  UIView* addedSubview;
  UIView* outerView;
  BOOL _visible;
  BOOL _modalPresented;
  BOOL _isHiding;
  UIViewController* _contoller;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge {
  if (self = [super init]) {
    _bridge = bridge;
    _startFromShortForm = false;
    _topOffset = [[NSNumber alloc] initWithInt: 42];
    _isShortFormEnabled = true;
    _longFormHeight = nil;
    _cornerRadius = [[NSNumber alloc] initWithInt: 8.0];
    _springDamping = [[NSNumber alloc] initWithDouble: 0.8];
    _transitionDuration = [[NSNumber alloc] initWithDouble: 0.5];
    _anchorModalToLongForm = true;
    _allowsDragToDismiss = true;
    _allowsTapToDismiss = true;
    _isUserInteractionEnabled = true;
    _isHapticFeedbackEnabled = true;
    _shouldRoundTopCorners = true;
    _showDragIndicator = true;
    _blocksBackgroundTouches = true;
    _headerHeight = [[NSNumber alloc] initWithInt:0];
    _shortFormHeight = [[NSNumber alloc] initWithInt:300];;
    _startFromShortForm = false;
    _presentGlobally = false;
    _interactsWithOuterScrollView = false;
    _initialAnimation = true;
    _unmountAnimation = true;
    _visible = true;
    _backgroundColor = [[UIColor alloc] initWithRed:0.0f green:0.0f blue:0.0f alpha:1];
    _backgroundOpacity = [[NSNumber alloc] initWithDouble:0.7];
    _modalPresented = false;
    _scrollsToTop = false;
    _isHiding = true;
    _gestureEnabled = true;
    outerView = nil;

  }
  return self;
}

-(void) setScrollsToTopOnTapStatusBar:(BOOL) scrollsToTop {
  self.scrollsToTop = scrollsToTop;
  if (_contoller != nil) {
    [_contoller performSelector:NSSelectorFromString(@"setScrollsToTopWithScrollsToTop:") withObject:[NSNumber numberWithBool:scrollsToTop]];
  }
}

-(void)jumpTo:(NSNumber*)longForm {
  if (_contoller != nil) {
    [_contoller performSelector:NSSelectorFromString(@"jumpToLong:") withObject:longForm];
  }
}


-(void)layout {
  if (_contoller != nil) {
    [_contoller performSelector:NSSelectorFromString(@"panModalSetNeedsLayoutUpdateWrapper")];
  }
}

-(void)reactSetFrame:(CGRect)frame {
  // shrug
}

- (void)didMoveToSuperview {
  [super didMoveToSuperview];
  [self setVisible:_visible];
}

-(void) didMoveToWindow {
  if (self.window == nil) {
    BOOL isBridgeInvalidating = [[_bridge valueForKey:@"didInvalidate"] boolValue];
    _isHiding = _presentGlobally || isBridgeInvalidating || _bridge == nil;
    [self setVisible:false];
  }
  [super didMoveToWindow];
}

- (void)callWillDismiss {
  _onWillDismiss(@{});
}

- (void)callDidDismiss {
  _onDidDismiss(@{});
}

- (void)setGestureEnabled:(BOOL)gestureEnabled {
  [_contoller.view.superview.superview.gestureRecognizers[0] setEnabled:gestureEnabled];
}

- (void)callOnCrossMagicBoderFromTop {
  _onCrossMagicBorder(@{@"below": @NO});
}

- (void)callOnCrossMagicBoderFromBottom {
  _onCrossMagicBorder(@{@"below": @YES});
}

- (void)callWillTransitionLong {
  _onWillTransition(@{@"type": @"long"});
}

- (void)callWillTransitionShort {
  _onWillTransition(@{@"type": @"short"});
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self setVisible:_visible];
}

- (void)setVisible:(BOOL)visible {
  _visible = visible;
  if (visible) {
    RCTExecuteOnMainQueue(^{
      self->outerView = self.reactSuperview;
      if (self->outerView == nil && !self->_presentGlobally) {
        return;
      }
      if (self->_modalPresented) {
        return;
      }
      if (self->addedSubview == nil) {
        return;
      }
      UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
      object_setClass(self->addedSubview, [HelperView class]);
      [(HelperView *)self->addedSubview setBridge: self->_bridge];

      self->_contoller = [rootViewController presentPanModalWithView:self->addedSubview config:self];
      self->_modalPresented = YES;
    });
  } else {
    //RCTExecuteOnMainQueue(^{
      if (!self->_modalPresented) {
        return;
      }
      NSNumber *oldTransitionDuration = self.transitionDuration;
      if (!self.unmountAnimation) {
        self.transitionDuration = [[NSNumber alloc] initWithDouble: 0];;
      }
      self.transitionDuration = [[NSNumber alloc] initWithDouble: 0];
      UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;

      [[rootViewController presentedViewController] dismissViewControllerAnimated:NO completion:^{
        if (self.onDidDismiss) {
          self.onDidDismiss(nil);
        }
        self.transitionDuration = oldTransitionDuration;
      }];
      //self->_contoller.view = nil;
      self->_contoller = nil;
      self->_isHiding = false;
      self->_modalPresented = NO;
    //});
  }
}


- (void)addSubview:(UIView *)view {
  if (addedSubview == nil) {
    addedSubview = view;
    [self setVisible:_visible];
  }
  addedSubview = view;
}

@end

@interface ModalViewManager : RCTViewManager<RCTBridgeModule>
@end

@implementation ModalViewManager

RCT_EXPORT_MODULE(DiscoverSheet)
RCT_EXPORT_VIEW_PROPERTY(longFormHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(springDamping, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(transitionDuration, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundOpacity, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(topOffset, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(headerHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(shortFormHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(isShortFormEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(anchorModalToLongForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(allowsTapToDismiss, BOOL)
RCT_EXPORT_VIEW_PROPERTY(allowsDragToDismiss, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(blocksBackgroundTouches, BOOL)
RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isHapticFeedbackEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(shouldRoundTopCorners, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showDragIndicator, BOOL)
RCT_EXPORT_VIEW_PROPERTY(startFromShortForm, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onWillTransition, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDidDismiss, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCrossMagicBorder, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(presentGlobally, BOOL)
RCT_EXPORT_VIEW_PROPERTY(interactsWithOuterScrollView, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollsToTopOnTapStatusBar, BOOL)
RCT_EXPORT_VIEW_PROPERTY(initialAnimation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(unmountAnimation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)

RCT_EXPORT_METHOD(jumpTo:(nonnull NSNumber*)point tag:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    InvisibleView *view = (InvisibleView *)viewRegistry[reactTag];
    [view jumpTo:point];
  }];

}

RCT_EXPORT_METHOD(layout:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    InvisibleView *view = (InvisibleView *)viewRegistry[reactTag];
    [view layout];
  }];

}


- (UIView *)view {
  return [[InvisibleView alloc] initWithBridge:self.bridge];
}

@end
