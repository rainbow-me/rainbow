//
//  RNCMScreenComponentView.h
//  React Native Cool Modals
//

#import <React/RCTViewComponentView.h>
#import <react/renderer/components/react_native_cool_modals/Props.h>

#import "RNCMScreenViewController.h"
#import "RNCoolModals-Swift.h"

@interface RNCMScreenComponentView : RCTViewComponentView <PanModalViewControllerScreen>

@property (weak, nonatomic) UIView *reactSuperview;
@property (nonatomic, retain) RNCMScreenViewController *controller;
@property (nonatomic, readonly) facebook::react::RNCMScreenStackAnimation stackAnimation;
@property (nonatomic, readonly) facebook::react::RNCMScreenStackPresentation stackPresentation;
@property (nonatomic, readonly) BOOL gestureEnabled;
@property (nonatomic, readonly) BOOL dismissed;

@property (nonatomic) facebook::react::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) facebook::react::LayoutMetrics newLayoutMetrics;

- (void)notifyDismissed;
- (void)notifyWillAppear;
- (void)updateBounds;
- (void)invalidateImpl;

@end
