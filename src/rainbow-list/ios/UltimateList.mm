#import "UltimateList.h"
#import "rainbow-me-ultimate-list.h"
#import <React/RCTBridge+Private.h>



@implementation UltimateList
@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
  if (!cxxBridge.runtime) {
    return;
  }


  osdnk::ultimatelist::installSimple(*(jsi::Runtime *)cxxBridge.runtime);
}

@end

