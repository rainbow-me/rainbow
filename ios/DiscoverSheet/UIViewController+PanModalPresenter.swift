import UIKit

import PanModal

class BetterGestureRecognizerDelegateAdapter: NSObject, UIGestureRecognizerDelegate {
  var grd: UIGestureRecognizerDelegate
  var config: InvisibleView
  required init(grd: UIGestureRecognizerDelegate, config: InvisibleView) {
    self.grd = grd
    self.config = config
    super.init()
  }
  public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    return self.grd.gestureRecognizer!(gestureRecognizer, shouldBeRequiredToFailBy: otherGestureRecognizer)
  }
  
  public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    return self.grd.gestureRecognizer!(gestureRecognizer, shouldRecognizeSimultaneouslyWith: otherGestureRecognizer)
  }
  
  public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRequireFailureOf otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    
    if (String(describing: type(of: otherGestureRecognizer))
          == "UIScrollViewPanGestureRecognizer"
          && (grd as? UIPresentationController)?.presentedViewController is PanModalPresentable && otherGestureRecognizer.view != ((grd as? UIPresentationController)?.presentedViewController as? PanModalPresentable)?.panScrollable) {
      return self.config.interactsWithOuterScrollView
    }
    return false
  }
}


extension Collection {
  subscript (safe index: Index) -> Element? {
    return indices.contains(index) ? self[index] : nil
  }
}

extension UIView {
  
  func getHelperView() -> HelperView? {
    if self.subviews.count > 1 &&
        self.subviews[1].subviews.count > 0 &&
        self.subviews[1].subviews[0] is HelperView &&
        (self.subviews[1].subviews[0] as! HelperView).controller != nil {
      return (self.subviews[1].subviews[0] as! HelperView);
    }
    return nil;
  }
  
  @objc func betterHitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let helperView = getHelperView()
    if helperView != nil {
      let config = helperView!.controller!.config
      let blocksBackgroundTocuhes = config?.blocksBackgroundTouches;
      if (blocksBackgroundTocuhes! || self.subviews[1].frame.contains(point)) {
        return self.betterHitTest(point, with: event)
      }
      return nil
    }
    return self.betterHitTest(point, with: event)
  }
  
  @objc func betterLayoutSubviews() {
    self.betterLayoutSubviews()
    let helperView = getHelperView()
    if helperView != nil {
      
      let controller = helperView!.controller!
      let config = controller.config
      
      let outerView = config?.value(forKey: "outerView") as? UIView
      if (!(config!.presentGlobally)) {
        if controller.moved {
          return
        }
        controller.moved = true
        removeFromSuperview()
        let bounds = outerView!.bounds
        let topOffset:CGFloat = (controller.topLayoutGuide.length ?? 0) + CGFloat(truncating: config?.topOffset as! NSNumber)
        let newBounds = CGRect.init(x: bounds.minX, y: bounds.minY, width: bounds.width, height: bounds.height - topOffset)
        helperView!.setSpecialBounds(newBounds)
        outerView?.addSubview(self)
        
        let gr: UIGestureRecognizer = self.gestureRecognizers![0]
        controller.grdelegate = BetterGestureRecognizerDelegateAdapter.init(grd: gr.delegate!, config: config!)
        gr.delegate = controller.grdelegate
      }
    }
    
  }
}

var PossiblyTouchesPassableUITransitionView: AnyClass?  = nil;

class DiscoverSheetViewController: UIViewController, PanModalPresentable {
  func hide() {
    
  }
  
  func unhackParent() {
    
  }
  
  var observation: NSKeyValueObservation?
  
  @objc func jumpTo(long: NSNumber) {
    self.panModalSetNeedsLayoutUpdate()
    if (long.boolValue) {
      panModalTransition(to: .longForm);
    } else {
      panModalTransition(to: .shortForm);
    }
    self.panModalSetNeedsLayoutUpdate()
  }
  
  var config: InvisibleView?
  var grdelegate: UIGestureRecognizerDelegate?
  var topLayoutGuideLength: CGFloat?
  var moved = false;
  var scrollView: UIScrollView?
  convenience init(config: InvisibleView) {
    self.init()
    self.config = config
  }
  
  @objc func panModalSetNeedsLayoutUpdateWrapper() {
    panModalSetNeedsLayoutUpdate()
  }
  
  override var preferredStatusBarStyle: UIStatusBarStyle {
    return .lightContent
  }
  
  func findChildScrollViewDFS(view: UIView)-> UIScrollView? {
    var viewsToTraverse = [view]
    while !viewsToTraverse.isEmpty {
      let last = viewsToTraverse.last!
      viewsToTraverse.removeLast()
      if last is UIScrollView {
        scrollView = (last as! UIScrollView);
        scrollView!.scrollsToTop = self.config?.scrollsToTop as! Bool
        return last as? UIScrollView
      }
      last.subviews.forEach { subview in
        viewsToTraverse.append(subview)
      }
    }
    return nil
  }
  
  @objc func setScrollsToTop(scrollsToTop: NSNumber) {
    scrollView?.scrollsToTop = scrollsToTop.boolValue;
  }
  
  var panScrollable: UIScrollView? {
    return findChildScrollViewDFS(view: self.view!)
  }
  
  var shortFormHeight: PanModalHeight {
    let height: CGFloat = CGFloat(truncating: self.config?.shortFormHeight ?? 0)
    return isShortFormEnabled ? .contentHeight(height) : longFormHeight
  }
  
  var topOffset: CGFloat {
    let topOffset: CGFloat = CGFloat(truncating: self.config?.topOffset ?? 0)
    return topLayoutGuide.length + topOffset
  }
  
  var isShortFormEnabledInternal = 2
  var isShortFormEnabled: Bool {
    let startFromShortForm = self.config?.startFromShortForm ?? false
    if isShortFormEnabledInternal > 0 && !startFromShortForm {
      isShortFormEnabledInternal -= 1
      return false
    }
    return self.config?.isShortFormEnabled ?? false
  }
  
  var longFormHeight: PanModalHeight {
    if self.config?.longFormHeight == nil {
      return .maxHeight
    }
    return .contentHeight(CGFloat(truncating: self.config?.longFormHeight ?? 0))
  }
  
  var cornerRadius: CGFloat {
    return CGFloat(truncating: self.config?.cornerRadius ?? 0)
  }
  
  var springDamping: CGFloat {
    return CGFloat(truncating: self.config?.springDamping ?? 0)
  }
  
  var isInitialAnimation = 3
  
  var transitionDuration: Double {
    if isInitialAnimation > 0 && !(self.config?.initialAnimation ?? false)
    {
      isInitialAnimation -= 1
      return 0.0
    }
    return Double(truncating: self.config?.transitionDuration ?? 0)
  }
  
  var panModalBackgroundColor: UIColor {
    return UIColor.black.withAlphaComponent(CGFloat(truncating: self.config?.backgroundOpacity ?? 0))
    
  }
  var anchorModalToLongForm: Bool {
    return self.config?.anchorModalToLongForm ?? false
  }
  
  var allowsDragToDismiss: Bool {
    return self.config?.allowsDragToDismiss ?? false
  }
  
  var allowsTapToDismiss: Bool {
    return self.config?.allowsTapToDismiss ?? false
  }
  
  var isUserInteractionEnabled: Bool {
    return self.config?.isUserInteractionEnabled ?? false  }
  
  var isHapticFeedbackEnabled: Bool {
    return self.config?.isHapticFeedbackEnabled ?? false  }
  
  var shouldRoundTopCorners: Bool {
    hack()
    return self.config?.shouldRoundTopCorners ?? false
  }
  
  override func viewDidLayoutSubviews() {
    hack()
  }
  
  func updatePostion(position: CGFloat, newPostion: CGFloat) {
    if (position < 80.0 && newPostion >= 80.0) {
      self.config?.performSelector(inBackground: Selector.init(("callOnCrossMagicBoderFromBottom")), with: nil)
    }
    
    if (position >= 80.0 && newPostion < 80.0) {
      self.config?.performSelector(inBackground: Selector.init(("callOnCrossMagicBoderFromTop")), with: nil)
    }
  }
  
  var hacked = false
  
  public func hack() {
    if !hacked {
      observation = (self.presentationController as! PanModalPresentationController).observe(\.yPosition, options: [.old, .new]) { object, change in
        self.updatePostion(position: change.oldValue!, newPostion: change.newValue!) }
    }
  }
  
  var showDragIndicator: Bool {
    return self.config?.showDragIndicator ?? false
  }
  
  var scrollIndicatorInsets: UIEdgeInsets {
    let bottomOffset = presentingViewController?.bottomLayoutGuide.length ?? 0
    return UIEdgeInsets(top: 0, left: 0, bottom: bottomOffset, right: 0)
  }
  
  
  func shouldPrioritize(panModalGestureRecognizer: UIPanGestureRecognizer) -> Bool {
    let headerHeight: CGFloat = CGFloat(truncating: self.config?.headerHeight ?? 0)
    let location = panModalGestureRecognizer.location(in: view)
    return location.y < headerHeight
  }
  
  func willTransition(to state: PanModalPresentationController.PresentationState) {
    if self.config?.onWillTransition != nil {
      if state == .longForm {
        self.config?.performSelector(inBackground: Selector.init(("callWillTransitionLong")), with: nil)
      } else {
        self.config?.performSelector(inBackground: Selector.init(("callWillTransitionShort")), with: nil)
      }
    }
  }
  
  func panModalWillDismiss() {
    if self.config?.onWillDismiss != nil {
      self.config?.performSelector(inBackground: Selector.init(("callWillDismiss")), with: nil)
    }
  }
  
  func panModalDidDismiss() {
    if self.config?.onDidDismiss != nil {
      self.config?.performSelector(inBackground: Selector.init(("callDidDismiss")), with: nil)
    }
  }
}

var swizzled = false;

func swizzle(uiTransitionView: UIView?) {
  if uiTransitionView == nil {
    return;
  }
  let UITransitionView: AnyClass = type(of: uiTransitionView!)
  if !swizzled {
    swizzled = true;
    let originalMethodLS = class_getInstanceMethod(UITransitionView, #selector(UIView.layoutSubviews))
    let swizzledMethodLS = class_getInstanceMethod(UITransitionView, #selector(UIView.betterLayoutSubviews))
    method_exchangeImplementations(originalMethodLS!, swizzledMethodLS!)
    let originalMethodHT = class_getInstanceMethod(UITransitionView, #selector(UIView.hitTest(_:with:)))
    let swizzledMethodHT = class_getInstanceMethod(UITransitionView, #selector(UIView.betterHitTest(_:with:)))
    method_exchangeImplementations(originalMethodHT!, swizzledMethodHT!)
  }
}

extension UIViewController {
  @objc public func presentPanModal(view: HelperView, config: InvisibleView) {
    if self.presentedViewController != nil || !swizzled {
      swizzle(uiTransitionView: config.window?.rootViewController?.view.superview?.superview)
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.03) {
        self.presentPanModal(view: view, config: config)
      }
    } else {
      let viewControllerToPresent: UIViewController & PanModalPresentable = DiscoverSheetViewController(config: config)
      viewControllerToPresent.view = view
      let sourceView: UIView? = nil, sourceRect: CGRect = .zero
      self.presentPanModal(viewControllerToPresent, sourceView: sourceView, sourceRect: sourceRect)
      view.controller = (viewControllerToPresent as! DiscoverSheetViewController);
      config.contoller = (viewControllerToPresent as! DiscoverSheetViewController);
    }
  }
}
