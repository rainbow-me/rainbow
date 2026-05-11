#import <UIKit/UIKit.h>
#import <React/RCTSurfaceTouchHandler.h>

@interface RCTSurfaceTouchHandler (RNCMTouchHandler)
- (void)rncm_cancelTouches;
@end

@interface UIView (RNCMTouchHandler)
- (nullable RCTSurfaceTouchHandler *)rncm_findTouchHandlerInAncestorChain;
@end

