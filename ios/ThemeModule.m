#import <React/RCTBridgeModule.h>
#import "AppDelegate.h"

@interface RNThemeModule : NSObject <RCTBridgeModule>

@end

@implementation RNThemeModule

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(setMode:(NSString *)mode) {
  if (@available(iOS 12.0, *)) {
    ((AppDelegate*) UIApplication.sharedApplication.delegate).window.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
  } else {
    // Fallback on earlier versions
  }
}

@end
