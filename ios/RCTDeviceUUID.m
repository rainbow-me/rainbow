#import "RCTDeviceUUID.h"

@implementation RCTDeviceUUID

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getUUID:(RCTResponseSenderBlock)callback)
{
  NSUUID *deviceId =  [UIDevice currentDevice].identifierForVendor;

  RCTLogInfo(@"Pretending to create an event");
  callback(@[[NSNull null], [NSArray arrayWithObjects: [deviceId UUIDString], nil]]);
}

@end