#import <React/RCTViewManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>

@interface RNCMScreenStackView : UIView <RCTInvalidating>

@property (nonatomic, copy) RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface RNCMScreenStackManager : RCTViewManager <RCTInvalidating>

@end
