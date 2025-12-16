//
//  WindowPortalComponentView.mm
//  React Native Cool Modals
//

#import "WindowPortalComponentView.h"

#import <react/renderer/components/react_native_cool_modals/ComponentDescriptors.h>
#import <react/renderer/components/react_native_cool_modals/Props.h>
#import <react/renderer/components/react_native_cool_modals/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface WindowPortalComponentView () <RCTWindowPortalViewProtocol>
@end

@interface CustomUIWindow : UIWindow

@property (nonatomic, weak) WindowPortalComponentView *portalView;
@property (nonatomic) BOOL profileForNotifications;

@end

@implementation CustomUIWindow
- (instancetype)init
{
  if (self = [super init]) {
    self.profileForNotifications = NO;
  }
  return self;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  if (self.portalView.blockTouches || self.subviews.count > 1) {
    return [super hitTest:point withEvent:event];
  }
  return nil;
}

@end

@implementation WindowPortalComponentView {
  __weak UIView *_childView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<WindowPortalComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
      _props = WindowPortalShadowNode::defaultSharedProps();
  }
  return self;
}

- (BOOL)blockTouches
{
  const auto &props = static_cast<const WindowPortalProps &>(*_props);
  return props.blockTouches;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  self.window = [[CustomUIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = [[UIViewController alloc] init];
  [self.window setWindowLevel:UIApplication.sharedApplication.delegate.window.windowLevel + 1];
  [self.window makeKeyAndVisible];
  self.window.rootViewController.view = [[UIView alloc] init];
  ((CustomUIWindow *)self.window).portalView = self;
  _childView = childComponentView;
  [self.window.rootViewController.view addSubview:childComponentView];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [self.window setHidden:YES];
  self.window.windowScene = nil;
  [self.window.rootViewController.view unmountChildComponentView:childComponentView index:index];
  self.window = nil;
  _childView = nil;
  [super unmountChildComponentView:childComponentView index:index];
}

- (void)removeFromSuperview
{
  [self.window setHidden:YES];
  self.window.windowScene = nil;
  if (_childView) {
    [self.window.rootViewController.view unmountChildComponentView:_childView index:0];
  }
  self.window = nil;
  _childView = nil;
  [super removeFromSuperview];
}

@end
