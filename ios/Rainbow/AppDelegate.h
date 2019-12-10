/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <UIKit/UIKit.h>

@interface AppDelegate : UIResponder <
  UIApplicationDelegate,
  RCTBridgeDelegate,
  RCTCxxBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
