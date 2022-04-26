#import <Foundation/Foundation.h>

#import "RNStartTime.h"
#import <sys/sysctl.h>
#include <math.h>
#import <QuartzCore/QuartzCore.h>

@implementation RNStartTime

RCT_EXPORT_MODULE()

/*
 function that retrieves the apps process data to get the timestamp the process started
 timestamps are returned in seconds as a floating point number with fractional second part
 timestamps are the UNIX Epoch timestamps relative to 00:00 1st Jan 1970 UTC
 */
static CFTimeInterval getProcessStartTime() {
  size_t len = 4;
  int mib[len];
  struct kinfo_proc kp;
  
  sysctlnametomib("kern.proc.pid", mib, &len);
  mib[3] = getpid();
  len = sizeof(kp);
  sysctl(mib, 4, &kp, &len, NULL, 0);
  
  struct timeval startTime = kp.kp_proc.p_un.__p_starttime;
  return startTime.tv_sec + startTime.tv_usec / 1e6;
}

- (NSDictionary *)constantsToExport
{
  /*
   getProcessStartTime returns value in seconds
   we are converting it to milliseconds and cutting the floating point part
   */
  return @{ @"START_TIME": [NSNumber numberWithDouble:floor(getProcessStartTime() * 1000)] };
}

@end
