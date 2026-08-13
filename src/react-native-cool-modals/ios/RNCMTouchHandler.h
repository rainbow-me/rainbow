#import <React/RCTSurfaceTouchHandler.h>
#import <UIKit/UIKit.h>

@interface RCTSurfaceTouchHandler (RNCMTouchHandler)
- (void)rncm_cancelTouches;
@end

@interface UIView (RNCMTouchHandler)
- (nullable RCTSurfaceTouchHandler *)rncm_findTouchHandlerInAncestorChain;
@end
