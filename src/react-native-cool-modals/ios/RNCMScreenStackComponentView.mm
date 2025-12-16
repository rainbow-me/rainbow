//
//  RNCMScreenStackComponentView.mm
//  React Native Cool Modals
//

#import "RNCMScreenStackComponentView.h"

#import <React/RCTMountingTransactionObserving.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTViewComponentView.h>
#import <React/UIView+React.h>
#import <react/renderer/components/react_native_cool_modals/ComponentDescriptors.h>
#import <react/renderer/components/react_native_cool_modals/EventEmitters.h>
#import <react/renderer/components/react_native_cool_modals/Props.h>
#import <react/renderer/components/react_native_cool_modals/RCTComponentViewHelpers.h>

#import "RNCMScreenComponentView.h"
#import "RNCMScreenViewController.h"
#import "RNCMTouchHandler.h"

using namespace facebook::react;

@interface RNCMScreenStackComponentView () <
    RCTRNCMScreenStackViewProtocol,
    UINavigationControllerDelegate,
    UIAdaptivePresentationControllerDelegate,
    UIGestureRecognizerDelegate,
    RCTMountingTransactionObserving>

@property (nonatomic) NSMutableArray<UIViewController *> *presentedModals;
@property (nonatomic) BOOL updatingModals;
@property (nonatomic) BOOL scheduleModalsUpdate;

@end

@interface RNCMScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>
- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
@end

@implementation RNCMScreenStackComponentView {
  UINavigationController *_controller;
  NSMutableArray<RNCMScreenComponentView *> *_reactSubviews;
  /// Screens that are subject of `ShadowViewMutation::Type::Delete` mutation
  /// in current transaction. This vector should be populated when we receive notification via
  /// `RCTMountingObserving` protocol, that a transaction will be performed, and should
  /// be cleaned up when we're notified that the transaction has been completed.
  std::vector<__strong RNCMScreenComponentView *> _toBeDeletedScreens;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNCMScreenStackComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = RNCMScreenStackShadowNode::defaultSharedProps();
    _reactSubviews = [NSMutableArray new];
    _presentedModals = [NSMutableArray new];
    _controller = [[UINavigationController alloc] init];
    _controller.delegate = self;

    // we have to initialize viewControllers with a non empty array for
    // largeTitle header to render in the opened state. If it is empty
    // the header will render in collapsed state which is perhaps a bug
    // in UIKit but ¯\_(ツ)_/¯
    [_controller setViewControllers:@[ [UIViewController new] ]];
  }
  return self;
}

- (UIViewController *)reactViewController
{
  return _controller;
}

- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  //  UIView *view = viewController.view;
  // // RNCMScreenStackHeaderConfig *config = nil;
  //  for (UIView *subview in view.reactSubviews) {
  ////    if ([subview isKindOfClass:[RNCMScreenStackHeaderConfig class]]) {
  ////  //    config = (RNCMScreenStackHeaderConfig*) subview;
  ////      break;
  ////    }
  //  }
  UINavigationController *navctr = (UINavigationController *)viewController.parentViewController;
  [navctr setNavigationBarHidden:YES animated:NO];
  //[RNCMScreenStackHeaderConfig willShowViewController:viewController animated:animated withConfig:config];
}

- (void)navigationController:(UINavigationController *)navigationController
       didShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  [self emitFinishTransitioning];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  // We don't directly set presentation delegate but instead rely on the ScreenView's delegate to
  // forward certain calls to the container (Stack).
  UIView *screenView = presentationController.presentedViewController.view;
  if ([screenView isKindOfClass:[RNCMScreenComponentView class]]) {
    [_presentedModals removeObject:presentationController.presentedViewController];
    // instead of directly triggering onFinishTransitioning this time we enqueue the event on the
    // main queue. We do that because onDismiss event is also enqueued and we want for the transition
    // finish event to arrive later than onDismiss (see RNCMScreen#notifyDismiss)
    dispatch_async(dispatch_get_main_queue(), ^{
      [self emitFinishTransitioning];
    });
  }
}

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController
                                  animationControllerForOperation:(UINavigationControllerOperation)operation
                                               fromViewController:(UIViewController *)fromVC
                                                 toViewController:(UIViewController *)toVC
{
  RNCMScreenComponentView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = (RNCMScreenComponentView *)toVC.view;
  } else if (operation == UINavigationControllerOperationPop) {
    screen = (RNCMScreenComponentView *)fromVC.view;
  }
  if (screen != nil &&
      (screen.stackAnimation == RNCMScreenStackAnimation::Fade ||
       screen.stackAnimation == RNCMScreenStackAnimation::None)) {
    return [[RNCMScreenStackAnimator alloc] initWithOperation:operation];
  }
  return nil;
}


- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  // cancel touches in parent, this is needed to cancel RN touch events. For example when Touchable
  // item is close to an edge and we start pulling from edge we want the Touchable to be cancelled.
  // Without the below code the Touchable will remain active (highlighted) for the duration of back
  // gesture and onPress may fire when we release the finger.
  auto touchHandler = [_controller.view rncm_findTouchHandlerInAncestorChain];
  [touchHandler rncm_cancelTouches];

  RNCMScreenComponentView *topScreen = (RNCMScreenComponentView *)_controller.viewControllers.lastObject.view;

  return _controller.viewControllers.count > 1 && topScreen.gestureEnabled;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (![childComponentView isKindOfClass:[RNCMScreenComponentView class]]) {
    RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }

  RCTAssert(
      childComponentView.reactSuperview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  ((RNCMScreenComponentView *)childComponentView).reactSuperview = self;
  [_reactSubviews insertObject:(RNCMScreenComponentView *)childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  RNCMScreenComponentView *screenChildComponent = (RNCMScreenComponentView *)childComponentView;
  [screenChildComponent.controller setViewToSnapshot];

  RCTAssert(
      screenChildComponent.reactSuperview == self,
      @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
      self,
      screenChildComponent,
      @(index));
  RCTAssert(
      (_reactSubviews.count > index) && [_reactSubviews objectAtIndex:index] == childComponentView,
      @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
      self,
      screenChildComponent,
      @(index),
      @([_reactSubviews indexOfObject:screenChildComponent]),
      @([[_reactSubviews objectAtIndex:index] tag]));
  screenChildComponent.reactSuperview = nil;
  [_reactSubviews removeObject:screenChildComponent];
  [screenChildComponent removeFromSuperview];
}

- (void)mountingTransactionWillMount:(const facebook::react::MountingTransaction &)transaction
                withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry
{
    for (const auto &mutation : transaction.getMutations()) {
      if (mutation.type == ShadowViewMutation::Delete) {
        RNCMScreenComponentView *_Nullable toBeRemovedChild = [self
        childScreenForTag:mutation.oldChildShadowView.tag]; if (toBeRemovedChild != nil) {
          _toBeDeletedScreens.push_back(toBeRemovedChild);
        }
      }
    }
}

- (void)mountingTransactionDidMount:(const facebook::react::MountingTransaction &)transaction
               withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry
{
  for (const auto &mutation : transaction.getMutations()) {
    // Note that self.tag might be invalid in cases this stack is removed.
    // This mostlikely does not cause any problems now, but it is something
    // worth to be aware of.
    if (mutation.parentTag == self.tag &&
        (mutation.type == ShadowViewMutation::Type::Insert || mutation.type == ShadowViewMutation::Type::Remove)) {
      // we need to wait until children have their layout set. At this point they don't have the layout
      // set yet, however the layout call is already enqueued on ui thread. Enqueuing update call on the
      // ui queue will guarantee that the update will run after layout.
      dispatch_async(dispatch_get_main_queue(), ^{
        [self maybeAddToParentAndUpdateContainer];
      });
      break;
    }
  }

  if (!self->_toBeDeletedScreens.empty()) {
    __weak RNCMScreenStackComponentView *weakSelf = self;
    // We want to run after container updates are performed (transitions etc.)
    dispatch_async(dispatch_get_main_queue(), ^{
      RNCMScreenStackComponentView *_Nullable strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      for (RNCMScreenComponentView *screenRef : strongSelf->_toBeDeletedScreens) {
        [screenRef invalidateImpl];
      }
      strongSelf->_toBeDeletedScreens.clear();
    });
  }
}

- (nullable RNCMScreenComponentView *)childScreenForTag:(Tag)tag
{
  for (RNCMScreenComponentView *child in _reactSubviews) {
    if (child.tag == tag) {
      return child;
    }
  }
  return nil;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _reactSubviews = [NSMutableArray new];

  for (UIViewController *controller in _presentedModals) {
    [controller dismissViewControllerAnimated:NO completion:nil];
  }

  [_presentedModals removeAllObjects];
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
  [_controller setViewControllers:@[ [UIViewController new] ]];
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (void)maybeAddToParentAndUpdateContainer
{
  BOOL wasScreenMounted = _controller.parentViewController != nil;
  if (!self.window && !wasScreenMounted) {
    // We wait with adding to parent controller until the stack is mounted.
    // If we add it when window is not attached, some of the view transitions will be blocked (i.e.
    // modal transitions) and the internal view controler's state will get out of sync with what's
    // on screen without us knowing.
    return;
  }
  [self updateContainer];
  if (!wasScreenMounted) {
    // when stack hasn't been added to parent VC yet we do two things:
    // 1) we run updateContainer (the one above) – we do this because we want push view controllers to
    // be installed before the VC is mounted. If we do that after it is added to parent the push
    // updates operations are going to be blocked by UIKit.
    // 2) we add navigation VS to parent – this is needed for the VC lifecycle events to be dispatched
    // properly
    // 3) we again call updateContainer – this time we do this to open modal controllers. Modals
    // won't open in (1) because they require navigator to be added to parent. We handle that case
    // gracefully in setModalViewControllers and can retry opening at any point.
    [self reactAddControllerToClosestParent:_controller];
    [self updateContainer];
  }
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

+ (UIViewController *)findTopMostPresentedViewControllerFromViewController:(UIViewController *)controller
{
  auto presentedVc = controller;
  while (presentedVc.presentedViewController != nil) {
    presentedVc = presentedVc.presentedViewController;
  }
  return presentedVc;
}

- (UIViewController *)findReactRootViewController
{
  UIView *parent = self;
  while (parent) {
    parent = parent.reactSuperview;
    if (parent.isReactRootView) {
      return parent.reactViewController;
    }
  }
  return nil;
}

- (void)setModalViewControllers:(NSArray<UIViewController *> *)controllers
{
  // prevent re-entry
  if (_updatingModals) {
    _scheduleModalsUpdate = YES;
    return;
  }

  // when there is no change we return immediately. This check is important because sometime we may
  // accidently trigger modal dismiss if we don't verify to run the below code only when an actual
  // change in the list of presented modal was made.
  if ([_presentedModals isEqualToArray:controllers]) {
    return;
  }

  // if view controller is not yet attached to window we skip updates now and run them when view
  // is attached
  if (self.window == nil && _presentedModals.lastObject.view.window == nil) {
    return;
  }

  _updatingModals = YES;

  // We need to find bottom-most view controller that should stay on the stack
  // for the duration of transition.

  // There are couple of scenarios:
  // (1) no modals are presented or all modals were presented by this RNSNavigationController,
  // (2) there are modals presented by other RNSNavigationControllers (nested/outer),
  // (3) there are modals presented by other controllers (e.g. React Native's Modal view).

  // Last controller that is common for both _presentedModals & controllers or this RNSNavigationController in case
  // there is no common part.
  __block UIViewController *changeRootController = _controller;

  // Last common controller index + 1
  NSUInteger changeRootIndex = 0;
  for (NSUInteger i = 0; i < MIN(_presentedModals.count, controllers.count); i++) {
    if (_presentedModals[i] == controllers[i]) {
      changeRootController = controllers[i];
      changeRootIndex = i + 1;
    } else {
      break;
    }
  }

  // we verify that controllers added on top of changeRootIndex are all new. Unfortunately modal
  // VCs cannot be reshuffled (there are some visual glitches when we try to dismiss then show as
  // even non-animated dismissal has delay and updates the screen several times)
  for (NSUInteger i = changeRootIndex; i < controllers.count; i++) {
    if ([_presentedModals containsObject:controllers[i]]) {
      RCTAssert(false, @"Modally presented controllers are being reshuffled, this is not allowed");
    }
  }

  __weak RNCMScreenStackComponentView *weakSelf = self;

  void (^afterTransitions)(void) = ^{
    [weakSelf emitFinishTransitioning];
    weakSelf.updatingModals = NO;
    if (weakSelf.scheduleModalsUpdate) {
      // if modals update was requested during setModalViewControllers we set scheduleModalsUpdate
      // flag in order to perform updates at a later point. Here we are done with all modals
      // transitions and check this flag again. If it was set, we reset the flag and execute updates.
      weakSelf.scheduleModalsUpdate = NO;
      [weakSelf updateContainer];
    }
  };

  void (^finish)(void) = ^{
    NSUInteger oldCount = weakSelf.presentedModals.count;
    if (changeRootIndex < oldCount) {
      [weakSelf.presentedModals removeObjectsInRange:NSMakeRange(changeRootIndex, oldCount - changeRootIndex)];
    }
    BOOL isAttached =
        changeRootController.parentViewController != nil || changeRootController.presentingViewController != nil;

    if (!isAttached || changeRootIndex >= controllers.count) {
      // if change controller view is not attached, presenting modals will silently fail on iOS.
      // In such a case we trigger controllers update from didMoveToWindow.
      // We also don't run any present transitions if changeRootIndex is greater or equal to the size
      // of new controllers array. This means that no new controllers should be presented.
      afterTransitions();
      return;
    }

    UIViewController *previous = changeRootController;

    for (NSUInteger i = changeRootIndex; i < controllers.count; i++) {
      UIViewController *next = controllers[i];
      BOOL lastModal = (i == controllers.count - 1);

      // Inherit UI style from its parent - solves an issue with incorrect style being applied to some UIKit views
      // like date picker or segmented control.
      next.overrideUserInterfaceStyle = self->_controller.overrideUserInterfaceStyle;

      BOOL shouldAnimate = lastModal && [next isKindOfClass:[RNCMScreenViewController class]] &&
          ((RNCMScreenViewController *)next).screenView.stackAnimation != RNCMScreenStackAnimation::None;

      // if you want to present another modal quick enough after dismissing the previous one,
      // it will result in wrong changeRootController, see repro in
      // https://github.com/software-mansion/react-native-screens/issues/1299 We call `updateContainer` again in
      // `presentationControllerDidDismiss` to cover this case and present new controller
      if (previous.beingDismissed) {
        return;
      }
        
        [previous presentModally:next
                                animated:lastModal
                              completion:^{
                                [weakSelf.presentedModals addObject:next];
                                if (lastModal) {
                                  afterTransitions();
                                };
                              }
                              slackStack:((RNCMScreenViewController *)next).screenView.customStack];
      previous = next;
    }
  };

  // changeRootController is the last controller that *is owned by this stack*, and should stay unchanged after this
  // batch of transitions. Therefore changeRootController.presentedViewController is the first constroller to be
  // dismissed (implying also all controllers above). Notice here, that firstModalToBeDismissed could have been
  // RNSScreen modal presented from *this* stack, another stack, or any other view controller with modal presentation
  // provided by third-party libraries (e.g. React Native's Modal view). In case of presence of other (not managed by
  // us) modal controllers, weird interactions might arise. The code below, besides handling our presentation /
  // dismissal logic also attempts to handle possible wide gamut of cases of interactions with third-party modal
  // controllers, however it's not perfect.
  // TODO: Find general way to manage owned and foreign modal view controllers and refactor this code. Consider building
  // model first (data structue, attempting to be aware of all modals in presentation and some text-like algorithm for
  // computing required operations).

  UIViewController *firstModalToBeDismissed = changeRootController.presentedViewController;

    if (firstModalToBeDismissed != nil) {
      const BOOL firstModalToBeDismissedIsOwned = [firstModalToBeDismissed isKindOfClass:RNCMScreenViewController.class];
      const BOOL firstModalToBeDismissedIsOwnedByThisStack =
          firstModalToBeDismissedIsOwned && [_presentedModals containsObject:firstModalToBeDismissed];

      if (firstModalToBeDismissedIsOwnedByThisStack || !firstModalToBeDismissedIsOwned) {
        // We dismiss every VC that was presented by changeRootController VC or its descendant.
        // After the series of dismissals is completed we run completion block in which
        // we present modals on top of changeRootController (which may be the this stack VC)
        //
        // There also might the second case, where the firstModalToBeDismissed is foreign.
        // See: https://github.com/software-mansion/react-native-screens/issues/2048
        // For now, to mitigate the issue, we also decide to trigger its dismissal before
        // starting the presentation chain down below in finish() callback.
        if (!firstModalToBeDismissed.isBeingDismissed) {
          // If the modal is owned we let it control whether the dismissal is animated or not. For foreign controllers
          // we just assume animation.
          const BOOL firstModalToBeDismissedPrefersAnimation = firstModalToBeDismissedIsOwned
              ? static_cast<RNCMScreenViewController *>(firstModalToBeDismissed).screenView.stackAnimation !=
                  RNCMScreenStackAnimation::None
              : YES;
          [changeRootController dismissViewControllerAnimated:firstModalToBeDismissedPrefersAnimation
                                                   completion:finish];
        } else {
          // We need to wait for its dismissal and then run our presentation code.
          // This happens, e.g. when we have foreign modal presented on top of owned one & we dismiss foreign one and
          // immediately present another owned one. Dismissal of the foreign one will be triggered by foreign
          // controller.
          [[firstModalToBeDismissed transitionCoordinator]
              animateAlongsideTransition:nil
                              completion:^(id<UIViewControllerTransitionCoordinatorContext> _) {
                                finish();
                              }];
        }
        return;
      }
    }

    // changeRootController does not have presentedViewController but it does not mean that no modals are in
    // presentation; modals could be presented by another stack (nested / outer), third-party view controller or they
    // could be using UIModalPresentationCurrentContext / UIModalPresentationOverCurrentContext presentation styles; in
    // the last case for some reason system asks top-level (react root) vc to present instead of our stack, despite the
    // fact that `definesPresentationContext` returns `YES` for UINavigationController. So we first need to find
    // top-level controller manually:
    UIViewController *reactRootVc = [self findReactRootViewController];
    UIViewController *topMostVc = [RNCMScreenStackComponentView findTopMostPresentedViewControllerFromViewController:reactRootVc];

    if (topMostVc != reactRootVc) {
      changeRootController = topMostVc;

      // Here we handle just the simplest case where the top level VC was dismissed. In any more complex
      // scenario we will still have problems, see: https://github.com/software-mansion/react-native-screens/issues/1813
      if ([_presentedModals containsObject:topMostVc] && ![controllers containsObject:topMostVc]) {
        [changeRootController dismissViewControllerAnimated:YES completion:finish];
        return;
      }
    }

  // We didn't detect any controllers for dismissal, thus we start presenting new VCs
  finish();
}

//- (void)setModalViewControllers:(NSArray<UIViewController *> *)controllers
//{
//  // prevent re-entry
//  if (_updatingModals) {
//    _scheduleModalsUpdate = YES;
//    return;
//  }
//
//  // when there is no change we return immediately. This check is important because sometime we may
//  // accidently trigger modal dismiss if we don't verify to run the below code only when an actual
//  // change in the list of presented modal was made.
//  if ([_presentedModals isEqualToArray:controllers]) {
//    return;
//  }
//
//  // if view controller is not yet attached to window we skip updates now and run them when view
//  // is attached
//  if (self.window == nil && _presentedModals.lastObject.view.window == nil) {
//    return;
//  }
//
//  _updatingModals = YES;
//
//  NSMutableArray<UIViewController *> *newControllers = [NSMutableArray arrayWithArray:controllers];
//  [newControllers removeObjectsInArray:_presentedModals];
//
//  // find bottom-most controller that should stay on the stack for the duration of transition
//  NSUInteger changeRootIndex = 0;
//  UIViewController *changeRootController = _controller;
//
//  // for QR scanner Bottom Sheet!
//  UIViewController *presentedRootViewController = changeRootController.presentedViewController;
//
//  if (presentedRootViewController != nil &&
//      ![presentedRootViewController isKindOfClass:RNCMScreenViewController.class] &&
//      ![NSStringFromClass(presentedRootViewController.class) isEqualToString:@"RNCoolModals.PanModalViewController"]) {
//    // lib
//
//    changeRootController = presentedRootViewController;
//  }
//
//  for (NSUInteger i = 0; i < MIN(_presentedModals.count, controllers.count); i++) {
//    if (_presentedModals[i] == controllers[i]) {
//      changeRootController = controllers[i];
//      changeRootIndex = i + 1;
//    } else {
//      break;
//    }
//  }
//
//  // we verify that controllers added on top of changeRootIndex are all new. Unfortunately modal
//  // VCs cannot be reshuffled (there are some visual glitches when we try to dismiss then show as
//  // even non-animated dismissal has delay and updates the screen several times)
//  for (NSUInteger i = changeRootIndex; i < controllers.count; i++) {
//    if ([_presentedModals containsObject:controllers[i]]) {
//      RCTAssert(false, @"Modally presented controllers are being reshuffled, this is not allowed");
//    }
//  }
//
//  __weak RNCMScreenStackComponentView *weakSelf = self;
//
//  void (^afterTransitions)(void) = ^{
//    [weakSelf emitFinishTransitioning];
//    weakSelf.updatingModals = NO;
//    if (weakSelf.scheduleModalsUpdate) {
//      // if modals update was requested during setModalViewControllers we set scheduleModalsUpdate
//      // flag in order to perform updates at a later point. Here we are done with all modals
//      // transitions and check this flag again. If it was set, we reset the flag and execute updates.
//      weakSelf.scheduleModalsUpdate = NO;
//      [weakSelf updateContainer];
//    }
//  };
//
//  void (^finish)(void) = ^{
//    NSUInteger oldCount = weakSelf.presentedModals.count;
//    if (changeRootIndex < oldCount) {
//      [weakSelf.presentedModals removeObjectsInRange:NSMakeRange(changeRootIndex, oldCount - changeRootIndex)];
//    }
//    BOOL isAttached =
//        changeRootController.parentViewController != nil || changeRootController.presentingViewController != nil;
//    if (!isAttached || changeRootIndex >= controllers.count) {
//      // if change controller view is not attached, presenting modals will silently fail on iOS.
//      // In such a case we trigger controllers update from didMoveToWindow.
//      // We also don't run any present transitions if changeRootIndex is greater or equal to the size
//      // of new controllers array. This means that no new controllers should be presented.
//      afterTransitions();
//      return;
//    } else {
//      UIViewController *previous = changeRootController;
//      for (NSUInteger i = changeRootIndex; i < controllers.count; i++) {
//        UIViewController *next = controllers[i];
//        BOOL lastModal = (i == controllers.count - 1);
//
//        [previous presentModally:next
//                        animated:lastModal
//                      completion:^{
//                        [weakSelf.presentedModals addObject:next];
//                        if (lastModal) {
//                          afterTransitions();
//                        };
//                      }
//                      slackStack:((RNCMScreenViewController *)next).screenView.customStack];
//        previous = next;
//      }
//    }
//  };
//
//  UIViewController *presentedViewController = changeRootController.presentedViewController;
//  if (![presentedViewController isKindOfClass:[RNCMScreenViewController class]] && presentedViewController != nil &&
//      presentedViewController.view != nil &&
//      [presentedViewController.view isKindOfClass:[RNCMScreenComponentView class]]) {
//    RNCMScreenComponentView *view = (RNCMScreenComponentView *)presentedViewController.view;
//    presentedViewController = view.controller;
//  }
//
//  if (presentedViewController != nil && ([_presentedModals containsObject:presentedViewController])) {
//    [RNCMScreenStackComponentView dismissViewControllerWrapper:changeRootController
//                                                      animated:(changeRootIndex == controllers.count)
//                                                    completion:finish];
//  } else {
//    finish();
//  }
//}

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
    __weak RNCMScreenStackComponentView *weakSelf = self;
    [_controller.transitionCoordinator
        animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
          // do nothing here, we only want to be notified when transition is complete
        }
        completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
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
  BOOL firstTimePush = ![lastTop isKindOfClass:[RNCMScreenViewController class]];

  BOOL shouldAnimate =
      !firstTimePush && ((RNCMScreenComponentView *)lastTop.view).stackAnimation != RNCMScreenStackAnimation::None;

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
  NSMutableArray<UIViewController *> *pushControllers = [NSMutableArray new];
  NSMutableArray<UIViewController *> *modalControllers = [NSMutableArray new];
  for (RNCMScreenComponentView *screen in _reactSubviews) {
    if (!screen.dismissed && screen.controller != nil) {
      if (pushControllers.count == 0) {
        // first screen on the list needs to be places as "push controller"
        [pushControllers addObject:screen.controller];
      } else {
        if (screen.stackPresentation == RNCMScreenStackPresentation::Push) {
          [pushControllers addObject:screen.controller];
        } else {
          [modalControllers addObject:screen.controller];
        }
      }
    }
  }

  [self setPushViewControllers:pushControllers];
  [self setModalViewControllers:modalControllers];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
}

- (std::shared_ptr<const RNCMScreenStackEventEmitter>)screenStackEventEmitter
{
  if (!_eventEmitter) {
    return nullptr;
  }

  assert(std::dynamic_pointer_cast<const RNCMScreenStackEventEmitter>(_eventEmitter));
  return std::static_pointer_cast<const RNCMScreenStackEventEmitter>(_eventEmitter);
}

- (void)emitFinishTransitioning
{
  auto eventEmitter = [self screenStackEventEmitter];
  if (eventEmitter) {
    eventEmitter->onFinishTransitioning({});
  }
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

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
  RNCMScreenComponentView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    UIViewController *toViewController =
        [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    screen = (RNCMScreenComponentView *)toViewController.view;
  } else if (_operation == UINavigationControllerOperationPop) {
    UIViewController *fromViewController =
        [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    screen = (RNCMScreenComponentView *)fromViewController.view;
  }

  if (screen != nil && screen.stackAnimation == RNCMScreenStackAnimation::None) {
    return 0;
  }
  return 0.35; // default duration
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  UIViewController *toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
  UIViewController *fromViewController =
      [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];

  if (_operation == UINavigationControllerOperationPush) {
    [[transitionContext containerView] addSubview:toViewController.view];
    toViewController.view.alpha = 0.0;
    [UIView animateWithDuration:[self transitionDuration:transitionContext]
        animations:^{
          toViewController.view.alpha = 1.0;
        }
        completion:^(BOOL finished) {
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  } else if (_operation == UINavigationControllerOperationPop) {
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    [UIView animateWithDuration:[self transitionDuration:transitionContext]
        animations:^{
          fromViewController.view.alpha = 0.0;
        }
        completion:^(BOOL finished) {
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  }
}

@end
