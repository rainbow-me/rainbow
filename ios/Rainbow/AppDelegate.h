/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import <Foundation/Foundation.h>
#import <Rainbow-Internals/Internals.h>

#import <RCTAppDelegate.h>
#import <Firebase.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

@class RCTBridge;

@interface AppDelegate : RCTAppDelegate

- (void)hideSplashScreenAnimated;

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic) BOOL isRapRunning;
@property (nonatomic, strong) RCTBridge *bridge;

@end
