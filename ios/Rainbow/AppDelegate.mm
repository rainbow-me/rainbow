/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "Firebase.h"
#import "AppDelegate.h"

// Expo modules must be imported before Rainbow-Swift.h
#import "ExpoModulesCore-Swift.h"
#import "Rainbow-Swift.h"

#import <RNBranch/RNBranch.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTReloadCommand.h>
#import <Sentry/Sentry.h>
#import "RNSplashScreen.h"
#import <AVFoundation/AVFoundation.h>
#import <mach/mach.h>

@interface RainbowSplashScreenManager : NSObject <RCTBridgeModule>
@end

@implementation RainbowSplashScreenManager

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(RainbowSplashScreen);

RCT_EXPORT_METHOD(hideAnimated) {
  [((AppDelegate*) UIApplication.sharedApplication.delegate) hideSplashScreenAnimated];
}

@end

@implementation AppDelegate

- (void)hideSplashScreenAnimated {
  UIView* subview = self.window.rootViewController.view.subviews.lastObject;
  UIView* rainbowIcon = subview.subviews.firstObject;
  if (![rainbowIcon isKindOfClass:UIImageView.class]) {
    return;
  }
  [UIView animateWithDuration:0.1
                        delay:0.0
                      options:UIViewAnimationOptionCurveEaseIn
  animations:^{
      rainbowIcon.transform = CGAffineTransformScale(CGAffineTransformIdentity, 0.0000000001, 0.0000000001);
      subview.alpha = 0.0;
  } completion:^(BOOL finished) {
      rainbowIcon.hidden = YES;
      [RNSplashScreen hide];
  }];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Rainbow";
  // Add custom initial props in the dictionary below. These are passed to the React Native ViewController.
  self.initialProps = @{};
  
  NSLog(@"⚙️ Rainbow internals are %@.", RAINBOW_INTERNALS_ENABLED ? @"enabled" : @"disabled");
  
  [FIRApp configure];
  [RNBranch initSessionWithLaunchOptions:launchOptions isReferrable:YES];
  
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRapInProgress:)
                                               name:@"rapInProgress"
                                             object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRapComplete:)
                                               name:@"rapCompleted"
                                             object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRsEscape:)
                                               name:@"rsEscape"
                                             object:nil];
  
  BOOL success = [super application:application didFinishLaunchingWithOptions:launchOptions];
  BOOL isDetox = [[[NSProcessInfo processInfo] arguments] containsObject:@"-IS_TEST"];
  
  if (isDetox) return success;

  if (success) {
      UIView *rootView = self.window.rootViewController.view;
      [RNSplashScreen showSplash:@"LaunchScreen" inRootView:rootView];
  }
  return success;
}

- (void)handleRsEscape:(NSNotification *)notification {
  NSDictionary* userInfo = notification.userInfo;
  NSString *msg = [NSString stringWithFormat:@"Escape via %@", userInfo[@"url"]];
  
  SentryBreadcrumb *breadcrumb = [[SentryBreadcrumb alloc] init];
  [breadcrumb setMessage:msg];
  [SentrySDK addBreadcrumb:breadcrumb];
  [SentrySDK captureMessage:msg];
}

- (void)handleRapInProgress:(NSNotification *)notification {
  self.isRapRunning = YES;
}

- (void)handleRapComplete:(NSNotification *)notification {
  self.isRapRunning = NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}
 
- (NSURL *)bundleURL
{
  #if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
  #else
   return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  #endif
}

-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification
       withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionBadge | UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner);
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if ([RNBranch application:application openURL:url options:options]) {
    return YES;
  }
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  [RNBranch continueUserActivity:userActivity];
  return YES;
}

- (void)applicationWillTerminate:(UIApplication *)application {
  if (self.isRapRunning) {
    SentryMessage *msg = [[SentryMessage alloc] initWithFormatted:@"applicationWillTerminate was called"];
    SentryEvent *sentryEvent = [[SentryEvent alloc] init];
    [sentryEvent setMessage: msg];
    [SentrySDK captureEvent:sentryEvent];
  }
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  // Reset the app icon badge
  [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
  // Clear WC notifications
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    NSMutableArray *identifiers = [[NSMutableArray alloc] init];
    [notifications enumerateObjectsUsingBlock:^(UNNotification * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
      UNNotificationRequest *request = [obj request];
      NSString *identifier = [request identifier];
      NSString *type = [[[request content] userInfo] valueForKey:@"type"];
      if ([type isEqualToString:@"wc"]) {
        [identifiers addObject:identifier];
      }
    }];
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:identifiers];
  }];
}

@end
