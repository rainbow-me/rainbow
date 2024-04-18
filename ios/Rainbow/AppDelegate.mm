/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "Firebase.h"
#import "AppDelegate.h"
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
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  NSLog(@"⚙️ Rainbow internals are %@.", RAINBOW_INTERNALS_ENABLED ? @"enabled" : @"disabled");

  // Firebase Init
  [FIRApp configure];

  // Branch Init
  [RNBranch initSessionWithLaunchOptions:launchOptions isReferrable:YES];

  // Define UNUserNotificationCenter
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  
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

   return [super application:application didFinishLaunchingWithOptions:launchOptions];
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
  #if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
  #else
   return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  #endif
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  if (@available(iOS 14.0, *)) {
    completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionBadge | UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner);
  } else {
    completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionBadge | UNNotificationPresentationOptionAlert);
  }
}


- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
	return [RCTLinkingManager application:application openURL:url
	sourceApplication:sourceApplication annotation:annotation];
}

// Only if your app is using [Universal Links]
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{

  return [RNBranch continueUserActivity:userActivity];

}

- (void)applicationWillTerminate:(UIApplication *)application {

  if(self.isRapRunning){
    SentryMessage *msg = [[SentryMessage alloc] initWithFormatted:@"applicationWillTerminate was called"];
    SentryEvent *sentryEvent = [[SentryEvent alloc] init];
    [sentryEvent setMessage: msg];
    [SentrySDK captureEvent:sentryEvent];
  }

}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    if ([RNBranch application:app openURL:url options:options])  {
        // do other deep link routing for other SDKs
    }
    return YES;
}

- (void)applicationDidBecomeActive:(UIApplication *)application{
  // delete the badge
  [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
  // delete the notifications from WC
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
