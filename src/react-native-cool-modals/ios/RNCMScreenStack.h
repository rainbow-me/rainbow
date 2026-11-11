#import <React/RCTViewManager.h>
#import <React/RCTInvalidating.h>

@class RNCMScreenView;

@interface RNCMScreenStackView : UIView <RCTInvalidating>

- (void)updateContainer;
- (void)setNeedsContainerUpdate;
- (void)screenDidDisappear:(RNCMScreenView *)screen;
- (void)cancelTouchesBelowScreen:(RNCMScreenView *)screen completion:(void (^)(void))completion;

@end

@interface RNCMScreenStackManager : RCTViewManager <RCTInvalidating>

@end
