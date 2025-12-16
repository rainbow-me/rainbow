#import "RNCMScreenViewController.h"

#import "RNCMScreenComponentView.h"
#import "RNCoolModals-Swift.h"

@implementation RNCMScreenViewController {
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
  UIViewController *_parentVC;
    RNCMScreenComponentView *_initialView;
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
    _initialView = (RNCMScreenComponentView *)view;
  }
  return self;
}

- (void)presentModally:(UIViewController *)viewControllerToPresent
              animated:(BOOL)flag
            completion:(void (^)(void))completion
            slackStack:(BOOL)slackStack
{
  return [_parentVC presentModally:viewControllerToPresent animated:flag completion:completion slackStack:slackStack];
}

- (void)dismissViewControllerAnimated:(BOOL)flag completion:(void (^)(void))completion
{
  if (self.parentViewController) {
    [self.parentViewController dismissViewControllerAnimated:flag completion:completion];
  } else {
    [super dismissViewControllerAnimated:flag completion:completion];
  }
}

- (UIViewController *)presentedViewController
{
  return [_parentVC presentedViewController];
}

- (UIViewController *)presentingViewController
{
  return [_parentVC presentingViewController];
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  [_parentVC viewDidLayoutSubviews];

  if (!CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [self.screenView updateBounds];
  }
}

- (void)presentViewController:(UIViewController *)viewControllerToPresent
                     animated:(BOOL)flag
                   completion:(void (^)(void))completion
{
  BOOL isContextMenu =
      [viewControllerToPresent isKindOfClass:NSClassFromString(@"_UIContextMenuActionsOnlyViewController")];

  if (isContextMenu) {
    [_parentVC presentViewController:viewControllerToPresent animated:flag completion:completion];
  } else {
    [super presentViewController:viewControllerToPresent animated:flag completion:completion];
  }
}

- (id)findFirstResponder:(UIView *)parent
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
    [self.screenView notifyDismissed];
  }
  _parentVC = nil;
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    [self.screenView notifyWillAppear];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
    [self.screenView notifyAppear];
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
}

- (PanModalViewController *)parentVC
{
  return (PanModalViewController *)_parentVC;
}

- (void)setViewToSnapshot
{
  UIView *superView = self.view.superview;
  // if we dismissed the view natively, it will already be detached from view hierarchy
  if (self.view.window != nil) {
    UIView *snapshot = [self.view snapshotViewAfterScreenUpdates:NO];
    snapshot.frame = self.view.frame;
    [self.view removeFromSuperview];
    [superView addSubview:snapshot];
  }
}

// since on Fabric the view of controller can be a snapshot of type `UIView`,
// when we want to check props of ScreenView, we need to get them from _initialView
- (RNCMScreenComponentView *)screenView
{
  return _initialView;
}

@end
