/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@import Firebase;
#import "AppDelegate.h"
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import <RNCPushNotificationIOS.h>
#import <Sentry/Sentry.h>
#import "RNSplashScreen.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  [application registerForRemoteNotifications];
   
  // React Native - Defaults
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"Rainbow"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
  
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
  selector:@selector(handleRapInProgress:)
      name:@"rapInProgress"
    object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
  selector:@selector(handleRapComplete:)
      name:@"rapCompleted"
    object:nil];
  
  // Splashscreen - react-native-splash-screen
  [RNSplashScreen show];
  return YES;
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
    return [NSURL URLWithString:[[[[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil] absoluteString] stringByAppendingString:@"&inlineSourceMap=true" ]];
  #else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  #endif
}

// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

// Required for the localNotification event.
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  [RNCPushNotificationIOS didReceiveLocalNotification:notification];
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
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
										restorationHandler:restorationHandler];
}


- (void)applicationWillTerminate:(UIApplication *)application {
  
  if(self.isRapRunning){
  
    NSDictionary *event = @{@"message": @"applicationWillTerminate was called"};
    
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:event
                                                       options:0
                                                         error:nil];

    SentryEvent *sentryEvent = [[SentryEvent alloc] initWithJSON:jsonData];
    [SentryClient.sharedClient sendEvent:sentryEvent withCompletionHandler:^(NSError * _Nullable error) {
      NSLog((@"ApplicationWillTerminate was called"));
    }];
  }
  
}


@end
