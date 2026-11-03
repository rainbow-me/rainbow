#ifndef COOL_MODALS_REACT_BOUNDARY_H
#define COOL_MODALS_REACT_BOUNDARY_H
#import <UIKit/UIKit.h>

// Only the React bridge boundary is replaced. UIKit controllers, layout,
// presentation, gestures and the production screen adapter remain real.
typedef void (^RCTDirectEventBlock)(NSDictionary *body);
typedef NS_ENUM(NSInteger, RCTPointerEvents) { RCTPointerEventsUnspecified };
@protocol RCTBridgeModule <NSObject>
@end
@protocol RCTInvalidating <NSObject>
- (void)invalidate;
@end
@interface RCTUIManager : NSObject
@property (nonatomic, readonly) NSArray<NSValue *> *publishedSizes;
- (void)setSize:(CGSize)size forView:(UIView *)view;
@end
@interface RCTBridge : NSObject
@property (nonatomic, strong) RCTUIManager *uiManager;
@end
@interface UIView (ReactBoundary)
- (UIView *)reactSuperview;
- (UIViewController *)reactViewController;
- (void)didSetProps:(NSArray<NSString *> *)props;
- (void)reactSetFrame:(CGRect)frame;
@end
@interface RCTView : UIView
@property (nonatomic) RCTPointerEvents pointerEvents;
@end
@interface RCTRootView : RCTView
@end
@interface RCTViewManager : NSObject <RCTBridgeModule>
@property (nonatomic, strong) RCTBridge *bridge;
@end
@interface RCTConvert : NSObject
@end
@interface RCTTouchHandler : UIGestureRecognizer
- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)attachToView:(UIView *)view;
- (void)detachFromView:(UIView *)view;
- (void)cancel;
@end
// Declaration needed by the actual stack syntax check.
@interface RCTRootContentView : UIView
@property (nonatomic, strong) RCTTouchHandler *touchHandler;
@end
@interface UIScreen (UnusedCornerBoundary)
@property (nonatomic, readonly) CGFloat displayCornerRadius;
@end
#define RCT_EXPORT_MODULE(...)
#define RCT_EXPORT_VIEW_PROPERTY(...)
#define RCT_ENUM_CONVERTER(...)
#define RCTLogError(...) NSLog(__VA_ARGS__)

#endif
