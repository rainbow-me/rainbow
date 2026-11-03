#import "ReactBoundary.h"
#import "RNCMScreen.h"
#import "RNCMScreenStack.h"

@implementation RCTUIManager {
  NSMutableArray<NSValue *> *_sizes;
}
- (instancetype)init { if (self = [super init]) _sizes = [NSMutableArray new]; return self; }
- (NSArray<NSValue *> *)publishedSizes { return [_sizes copy]; }
- (void)setSize:(CGSize)size forView:(UIView *)view { [_sizes addObject:[NSValue valueWithCGSize:size]]; }
@end
@implementation RCTBridge
- (instancetype)init { if (self = [super init]) _uiManager = [RCTUIManager new]; return self; }
@end
@implementation UIView (ReactBoundary)
- (UIView *)reactSuperview { return self.superview; }
- (UIViewController *)reactViewController { return nil; }
- (void)didSetProps:(NSArray<NSString *> *)props {}
- (void)reactSetFrame:(CGRect)frame { self.frame = frame; }
@end
@implementation RCTView
@end
@implementation RCTRootView
@end
@implementation RCTViewManager
@end
@implementation RCTConvert
@end
@implementation RCTTouchHandler
- (instancetype)initWithBridge:(RCTBridge *)bridge { return [super initWithTarget:nil action:nil]; }
- (void)attachToView:(UIView *)view { if (self.view != view) [view addGestureRecognizer:self]; }
- (void)detachFromView:(UIView *)view { [view removeGestureRecognizer:self]; }
- (void)cancel { self.enabled = NO; self.enabled = YES; }
@end
@implementation UIScreen (UnusedCornerBoundary)
- (CGFloat)displayCornerRadius { [NSException raise:@"UnexercisedBoundary" format:@"The suite uses an explicit corner radius"]; return 0; }
@end
// The suite records adapter notifications at this boundary; it does not
// substitute a model of the production native stack's reconciliation policy.
@implementation RNCMScreenStackView
- (void)updateContainer {}
- (void)setNeedsContainerUpdate {}
- (void)screenDidDisappear:(RNCMScreenView *)screen {}
- (void)cancelTouchesBelowScreen:(RNCMScreenView *)screen completion:(void (^)(void))completion { completion(); }
- (void)invalidate {}
@end
