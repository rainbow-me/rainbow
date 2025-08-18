#import <React/RCTBridgeModule.h>

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
  UIApplication.sharedApplication.delegate.window.overrideUserInterfaceStyle =
  [mode isEqualToString:@"dark"] ? UIUserInterfaceStyleDark : UIUserInterfaceStyleLight;
}

@end
