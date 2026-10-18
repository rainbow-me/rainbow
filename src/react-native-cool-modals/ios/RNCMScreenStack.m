#import "RNCMScreenStack.h"
#import "RNCMScreen.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTShadowView.h>
#import <React/RCTRootContentView.h>
#import <React/RCTTouchHandler.h>
// lib
#import "Rainbow-Swift.h"

@interface RNCMScreenStackView () <UINavigationControllerDelegate, UIAdaptivePresentationControllerDelegate, UIGestureRecognizerDelegate>

@property (nonatomic) NSMutableArray<UIViewController *> *presentedModals;


@end

@interface RNCMScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>
- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
@end

@implementation RNCMScreenStackView {
  UINavigationController *_controller;
  NSMutableArray<RNCMScreenView *> *_reactSubviews;
  NSMutableSet<UIViewController *> *_dismissingModals;
  UIViewController *_presentingModal;
  BOOL _invalidated;
  BOOL _updateScheduled;
  BOOL _updatingContainer;
  BOOL _needsUpdate;
}

- (instancetype)initWithManager:(RNCMScreenStackManager*)manager
{
  if (self = [super init]) {
    _dismissingModals = [NSMutableSet new];
    _reactSubviews = [NSMutableArray new];
    _presentedModals = [NSMutableArray new];
    _controller = [[UINavigationController alloc] init];
    _controller.delegate = self;

    // we have to initialize viewControllers with a non empty array for
    // largeTitle header to render in the opened state. If it is empty
    // the header will render in collapsed state which is perhaps a bug
    // in UIKit but ¯\_(ツ)_/¯
    [_controller setViewControllers:@[[UIViewController new]]];
  }
  return self;
}

- (UIViewController *)reactViewController
{
  return _controller;
}

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  UINavigationController *navctr = (UINavigationController *)viewController.parentViewController;
  [navctr setNavigationBarHidden:YES animated:NO];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  [self updateContainer];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  [self updateContainer];
}

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController animationControllerForOperation:(UINavigationControllerOperation)operation fromViewController:(UIViewController *)fromVC toViewController:(UIViewController *)toVC
{
  RNCMScreenView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = (RNCMScreenView *) toVC.view;
  } else if (operation == UINavigationControllerOperationPop) {
    screen = (RNCMScreenView *) fromVC.view;
  }
  if (screen != nil && (screen.stackAnimation == RNSScreenStackAnimationFade || screen.stackAnimation == RNSScreenStackAnimationNone)) {
    return  [[RNCMScreenStackAnimator alloc] initWithOperation:operation];
  }
  return nil;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  // cancel touches in parent, this is needed to cancel RN touch events. For example when Touchable
  // item is close to an edge and we start pulling from edge we want the Touchable to be cancelled.
  // Without the below code the Touchable will remain active (highlighted) for the duration of back
  // gesture and onPress may fire when we release the finger.
  UIView *parent = _controller.view;
  while (parent != nil && ![parent isKindOfClass:[RCTRootContentView class]]) parent = parent.superview;
  RCTRootContentView *rootView = (RCTRootContentView *)parent;
  [rootView.touchHandler cancel];

  RNCMScreenView *topScreen = (RNCMScreenView *)_controller.viewControllers.lastObject.view;

  return _controller.viewControllers.count > 1 && topScreen.gestureEnabled;
}

- (void)insertReactSubview:(RNCMScreenView *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[RNCMScreenView class]]) {
    RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }
  subview.reactSuperview = self;
  [_reactSubviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactSubview:(RNCMScreenView *)subview
{
  subview.reactSuperview = nil;
  [_reactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (void)didUpdateReactSubviews
{
  [self setNeedsContainerUpdate];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window) [self setNeedsContainerUpdate];
}

- (void)reactAddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.reactSuperview;
    while (parentView) {
      if (parentView.reactViewController) {
        [parentView.reactViewController addChildViewController:controller];
        [self addSubview:controller.view];
        _controller.interactivePopGestureRecognizer.delegate = self;
        [controller didMoveToParentViewController:parentView.reactViewController];
        // On iOS pre 12 we observed that `willShowViewController` delegate method does not always
        // get triggered when the navigation controller is instantiated. As the only thing we do in
        // that delegate method is ask nav header to update to the current state it does not hurt to
        // trigger that logic from here too such that we can be sure the header is properly updated.
        [self navigationController:_controller willShowViewController:_controller.topViewController animated:NO];
        break;
      }
      parentView = (UIView *)parentView.reactSuperview;
    }
    return;
  }
}

- (void)setNeedsContainerUpdate
{
  if (_invalidated || _updateScheduled) return;
  _updateScheduled = YES;
  __weak RNCMScreenStackView *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    RNCMScreenStackView *stack = weakSelf;
    if (stack == nil) return;
    stack->_updateScheduled = NO;
    [stack updateContainer];
  });
}

- (void)screenDidDisappear:(RNCMScreenView *)screen
{
  if (_invalidated) return;
  // A controller can leave its UIKit parent without leaving the requested stack
  if (![_dismissingModals containsObject:screen.controller] || !screen.inStack || screen.skipsOnReturn) {
    [screen notifyDismissed];
  }
  [_presentedModals removeObject:screen.controller];
  [self setNeedsContainerUpdate];
}

- (void)dismissScreen:(RNCMScreenView *)screen
{
  UIViewController *controller = screen.controller;
  if ([_dismissingModals containsObject:controller]) return;
  PanModalViewController *presenter = (PanModalViewController *)[(RNCMScreen *)controller parentVC];
  if (presenter == nil || presenter.presentingViewController == nil) return;

  [_dismissingModals addObject:controller];
  __weak RNCMScreenStackView *weakSelf = self;
  void (^completion)(void) = ^{
    RNCMScreenStackView *stack = weakSelf;
    if (stack == nil) return;
    [stack->_dismissingModals removeObject:controller];
    [stack updateContainer];
  };
  BOOL animated = screen.stackAnimation != RNSScreenStackAnimationNone;
  if (screen.customStack) {
    [presenter dismissPanModalWithAnimated:animated completion:completion];
  } else {
    [presenter dismissViewControllerAnimated:animated completion:completion];
  }
}

- (void)setModalViewControllers:(NSArray<UIViewController *> *)controllers
{
  if (self.window == nil) return;

  // Only established presentations count toward the history limit
  NSUInteger newerScreens = 0;
  for (RNCMScreen *controller in [_presentedModals reverseObjectEnumerator]) {
    RNCMScreenView *screen = (RNCMScreenView *)controller.view;
    if (controller == _presentingModal || !screen.inStack || screen.dismissed) continue;
    if (screen.limitActiveModals && newerScreens >= 2) screen.skipsOnReturn = YES;
    newerScreens++;
  }

  NSMutableArray<UIViewController *> *desired = [NSMutableArray new];
  for (RNCMScreen *controller in controllers) {
    if (!((RNCMScreenView *)controller.view).skipsOnReturn) [desired addObject:controller];
  }

  // Removing an ancestor does not require recreating its surviving descendants
  NSUInteger desiredIndex = 0;
  NSUInteger rebuildFrom = NSNotFound;
  for (NSUInteger i = 0; i < _presentedModals.count; i++) {
    UIViewController *controller = _presentedModals[i];
    if (![desired containsObject:controller]) continue;
    if (desiredIndex >= desired.count || desired[desiredIndex] != controller) {
      rebuildFrom = i;
      break;
    }
    desiredIndex++;
  }

  BOOL hasSurvivingChild = NO;
  NSArray<UIViewController *> *presented = [_presentedModals copy];
  for (NSInteger i = presented.count - 1; i >= 0; i--) {
    RNCMScreen *controller = (RNCMScreen *)presented[i];
    RNCMScreenView *screen = (RNCMScreenView *)controller.view;
    PanModalViewController *presenter = (PanModalViewController *)[controller parentVC];
    BOOL rebuild = rebuildFrom != NSNotFound && (NSUInteger)i >= rebuildFrom;
    BOOL wanted = [desired containsObject:controller] && !rebuild;
    screen.userInteractionEnabled = wanted && !screen.skipsOnReturn;

    if (controller == _presentingModal) {
      hasSurvivingChild = YES;
    } else if (!wanted) {
      if (hasSurvivingChild && screen.customStack) [presenter hide];
      else [self dismissScreen:screen];
    } else if (!presenter.dismissing && ![_dismissingModals containsObject:controller]) {
      hasSurvivingChild = YES;
    }
  }

  if (_presentingModal != nil || _dismissingModals.count != 0 || rebuildFrom != NSNotFound) return;

  UIViewController *presenter = _controller;
  UIViewController *externalPresenter = presenter.presentedViewController;
  if (externalPresenter != nil && ![externalPresenter isKindOfClass:[PanModalViewController class]] &&
      ![externalPresenter isKindOfClass:[RNCMScreen class]]) {
    // The QR scanner may supply the presentation context outside this stack
    presenter = externalPresenter;
  }

  for (RNCMScreen *controller in _presentedModals) {
    PanModalViewController *modal = (PanModalViewController *)[controller parentVC];
    if (modal.dismissing || modal.isBeingDismissed || modal.isBeingPresented) return;
    presenter = modal;
  }

  if (desiredIndex >= desired.count || presenter == nil ||
      (presenter.parentViewController == nil && presenter.presentingViewController == nil)) return;

  UIViewController *next = desired[desiredIndex];
  _presentingModal = next;
  [_presentedModals addObject:next];
  __weak RNCMScreenStackView *weakSelf = self;
  [presenter presentModally:next
                  animated:((RNCMScreenView *)next.view).stackAnimation != RNSScreenStackAnimationNone
                completion:^{
    RNCMScreenStackView *stack = weakSelf;
    if (stack == nil) return;
    stack->_presentingModal = nil;
    // PanModal starts its opening spring after completing the UIKit transition
    [stack setNeedsContainerUpdate];
  } slackStack:((RNCMScreenView *)next.view).customStack];
}

- (void)setPushViewControllers:(NSArray<UIViewController *> *)controllers
{
  // when there is no change we return immediately
  if ([_controller.viewControllers isEqualToArray:controllers]) {
    return;
  }

  // if view controller is not yet attached to window we skip updates now and run them when view
  // is attached
  if (self.window == nil) {
    return;
  }
  // when transition is ongoing, any updates made to the controller will not be reflected until the
  // transition is complete. In particular, when we push/pop view controllers we expect viewControllers
  // property to be updated immediately. Based on that property we then calculate future updates.
  // When the transition is ongoing the property won't be updated immediatly. We therefore avoid
  // making any updated when transition is ongoing and schedule updates for when the transition
  // is complete.
  if (_controller.transitionCoordinator != nil) {
    __weak RNCMScreenStackView *weakSelf = self;
    [_controller.transitionCoordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
      // do nothing here, we only want to be notified when transition is complete
    } completion:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
      [weakSelf updateContainer];
    }];
    return;
  }

  UIViewController *top = controllers.lastObject;
  UIViewController *lastTop = _controller.viewControllers.lastObject;

  // at the start we set viewControllers to contain a single UIVIewController
  // instance. This is a workaround for header height adjustment bug (see comment
  // in the init function). Here, we need to detect if the initial empty
  // controller is still there
  BOOL firstTimePush = ![lastTop isKindOfClass:[RNCMScreen class]];

  BOOL shouldAnimate = !firstTimePush && ((RNCMScreenView *) lastTop.view).stackAnimation != RNSScreenStackAnimationNone;

  if (firstTimePush) {
    // nothing pushed yet
    [_controller setViewControllers:controllers animated:NO];
  } else if (top != lastTop) {
    if (![controllers containsObject:lastTop]) {
      // last top controller is no longer on stack
      // in this case we set the controllers stack to the new list with
      // added the last top element to it and perform (animated) pop
      NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
      [newControllers addObject:lastTop];
      [_controller setViewControllers:newControllers animated:NO];
      [_controller popViewControllerAnimated:shouldAnimate];
    } else if (![_controller.viewControllers containsObject:top]) {
      // new top controller is not on the stack
      // in such case we update the stack except from the last element with
      // no animation and do animated push of the last item
      NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
      [newControllers removeLastObject];
      [_controller setViewControllers:newControllers animated:NO];
      [_controller pushViewController:top animated:shouldAnimate];
    } else {
      // don't really know what this case could be, but may need to handle it
      // somehow
      [_controller setViewControllers:controllers animated:shouldAnimate];
    }
  } else {
    // change wasn't on the top of the stack. We don't need animation.
    [_controller setViewControllers:controllers animated:NO];
  }
}

- (void)updateContainer
{
  if (_invalidated) return;
  if (_updatingContainer) {
    _needsUpdate = YES;
    return;
  }
  _updatingContainer = YES;
  do {
    _needsUpdate = NO;
    NSMutableArray<UIViewController *> *pushControllers = [NSMutableArray new];
    NSMutableArray<UIViewController *> *modalControllers = [NSMutableArray new];
    for (RNCMScreenView *screen in _reactSubviews) {
      [screen applyConfiguration];
      if (!screen.inStack || screen.dismissed || screen.controller == nil) continue;
      if (pushControllers.count == 0 || screen.stackPresentation == RNSScreenStackPresentationPush) {
        [pushControllers addObject:screen.controller];
      } else {
        [modalControllers addObject:screen.controller];
      }
    }

    if (pushControllers.count) [self setPushViewControllers:pushControllers];
    if (self.window) [self reactAddControllerToClosestParent:_controller];
    [self setModalViewControllers:modalControllers];

    for (RNCMScreenView *screen in _reactSubviews) {
      if (!screen.inStack && !screen.dismissed && screen.controller != _presentingModal &&
          ![_presentedModals containsObject:screen.controller] &&
          ![_controller.viewControllers containsObject:screen.controller]) {
        [screen notifyDismissed];
      }
    }
  } while (_needsUpdate);
  _updatingContainer = NO;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
}

- (void)invalidate
{
  _invalidated = YES;
  NSArray<UIViewController *> *presented = [_presentedModals copy];
  [_presentedModals removeAllObjects];
  [_dismissingModals removeAllObjects];
  _presentingModal = nil;
  for (RNCMScreen *controller in presented) {
    [[controller parentVC] dismissViewControllerAnimated:NO completion:nil];
  }
  [_controller.view removeFromSuperview];
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
}

- (void)dismissOnReload
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self invalidate];
  });
}

@end

@implementation RNCMScreenStackManager {
  NSPointerArray *_stacks;
}

RCT_EXPORT_MODULE()


- (UIView *)view
{
  RNCMScreenStackView *view = [[RNCMScreenStackView alloc] initWithManager:self];
  if (!_stacks) {
    _stacks = [NSPointerArray weakObjectsPointerArray];
  }
  [_stacks addPointer:(__bridge void *)view];
  return view;
}

- (void)invalidate
{
  for (RNCMScreenStackView *stack in _stacks) {
    [stack dismissOnReload];
  }
  _stacks = nil;
}

@end

@implementation RNCMScreenStackAnimator {
  UINavigationControllerOperation _operation;
}

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation
{
  if (self = [super init]) {
    _operation = operation;
  }
  return self;
}

- (NSTimeInterval)transitionDuration:(id <UIViewControllerContextTransitioning>)transitionContext
{
  RNCMScreenView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    UIViewController* toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    screen = (RNCMScreenView *)toViewController.view;
  } else if (_operation == UINavigationControllerOperationPop) {
    UIViewController* fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    screen = (RNCMScreenView *)fromViewController.view;
  }

  if (screen != nil && screen.stackAnimation == RNSScreenStackAnimationNone) {
    return 0;
  }
  return 0.35; // default duration
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  UIViewController* toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
  UIViewController* fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];

  if (_operation == UINavigationControllerOperationPush) {
    [[transitionContext containerView] addSubview:toViewController.view];
    toViewController.view.alpha = 0.0;
    [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
      toViewController.view.alpha = 1.0;
    } completion:^(BOOL finished) {
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    }];
  } else if (_operation == UINavigationControllerOperationPop) {
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
      fromViewController.view.alpha = 0.0;
    } completion:^(BOOL finished) {
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    }];
  }
}

@end
