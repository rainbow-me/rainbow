
import PanModal


public extension UIView {
  @objc func newHitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    if (self.superview!.superview == nil && self.subviews.count == 2 && self.subviews[1] is PanModal.PanContainerView) {
      let container = self.subviews[1]
      if (container.subviews.count == 1 && container.subviews[0] is RNCMScreenView) {
        let screen = container.subviews[0]
        let hacked = ((screen.reactViewController() as? RNCMScreen)?.parentVC() as? PanModalViewController)?.hacked ?? false
        if hacked {
          if (self.subviews[1].frame.contains(point)) {
            return self.subviews[1].hitTest(point, with: event)
          }
          return nil
        }
      }
    }
    return self.newHitTest(point, with: event)
  }
}

class PanModalViewController: UIViewController, PanModalPresentable, UILayoutSupport {
  static var swizzled = false
  @objc var config : RNCMScreenView?
  var length: CGFloat = 0
  var topAnchor: NSLayoutYAxisAnchor = NSLayoutYAxisAnchor.init()
  var bottomAnchor: NSLayoutYAxisAnchor = NSLayoutYAxisAnchor.init()
  var heightAnchor: NSLayoutDimension = NSLayoutDimension.init()
  var state: PanModalPresentationController.PresentationState? = nil;
  var disappared = false
  var hiding = false
  var ppview: UIView?

  weak var viewController: UIViewController?
  var panScrollableCache: UIScrollView?

  convenience init(_ viewControllerToPresent: UIViewController) {
    self.init(nibName: nil, bundle: nil)

    viewControllerToPresent.setValue(self, forKey: "_parentVC")
    viewController = viewControllerToPresent
    config = (viewControllerToPresent.view as! RNCMScreenView)
    state = (config?.startFromShortForm ?? false) ? PanModalPresentationController.PresentationState.shortForm : PanModalPresentationController.PresentationState.longForm;
  }

  @objc func hide() {
    hiding = true
    hackParent()
    panModalTransition(to: .hidden)
  }

  @objc func jumpTo(long: NSNumber) {
    if (hasAskedAboutShortForm > 0) {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) {
        // actively waiting
        self.jumpTo(long: long)
      }
      return;
    }
    self.panModalSetNeedsLayoutUpdate()
    if (long.boolValue) {
      panModalTransition(to: .longForm);
    } else {
      panModalTransition(to: .shortForm);
    }
  }
  
  @objc func rejump() {
    self.panModalSetNeedsLayoutUpdate()
    self.panModalTransition(to: self.state!)
  }

  @objc func panModalSetNeedsLayoutUpdateWrapper() {
    panModalSetNeedsLayoutUpdate()
  }
  
  var forceDisableShortForm = false
  
  func willTransition(to state: PanModalPresentationController.PresentationState) {
    if state == .longForm && config?.disableShortFormAfterTransitionToLongForm ?? false {
      forceDisableShortForm = true
      self.panModalSetNeedsLayoutUpdate()
    }
    self.state = state;
  }


  @objc func unhackParent() {
    self.hacked = false
    self.ppview = nil
  }


  func onTouchTop(_ dismissing: Bool) {
    let selector = NSSelectorFromString("onTouchTopWrapper:")
    config?.perform(selector, with: NSNumber.init(value: dismissing))
  }

  override var bottomLayoutGuide: UILayoutSupport {
    get {
      if self.isViewLoaded {
        return super.bottomLayoutGuide
      }
      return self
    }
  }

  var hacked = false
  var originalMethod: Method? = nil
  func hackParent() {
    hacked = true
    self.ppview = config!.superview!.superview!
    let poldClass: AnyClass = type(of: self.ppview!)
    if !PanModalViewController.swizzled {
      self.originalMethod = class_getInstanceMethod(poldClass, #selector(UIView.hitTest(_:with:)))
      let swizzledMethod = class_getInstanceMethod(poldClass, #selector(UIView.newHitTest(_:with:)))
      method_exchangeImplementations(self.originalMethod!, swizzledMethod!)
      PanModalViewController.swizzled = true
    }
  }

  var cornerRadius: CGFloat {
    if (self.config?.cornerRadius == 0.666) {
      return UIScreen.main.displayCornerRadius
    }
    return CGFloat(truncating: self.config?.cornerRadius ?? 0)
  }

  var ignoreBottomOffset: Bool {
    return self.config!.ignoreBottomOffset;
  }

  var isHapticFeedbackEnabled: Bool = false

  func findChildScrollViewDFS(view: UIView)-> UIScrollView? {
    if panScrollableCache != nil {
      return panScrollableCache
    }
    var foundScrollViews = 0
    var viewsToTraverse = [view]
    while !viewsToTraverse.isEmpty {
      let last = viewsToTraverse.last!
      viewsToTraverse.removeLast()
      if last is UIScrollView {
        foundScrollViews += 1
        if foundScrollViews == relevantScrollViewDepth {
          panScrollableCache = last as? UIScrollView
          return last as? UIScrollView
        }
      }
      last.subviews.forEach { subview in
        viewsToTraverse.append(subview)
      }
    }
    return nil
  }

  override var view: UIView! {
    get {
      if (viewController == nil) {
        return UIView()
      }
      return viewController!.view
    }
    set {

    }
  }


  func panModalWillDismiss() {
    callWillDismiss()
  }

  func callWillDismiss() {
    config?.willDismiss()
  }

  func shouldRespond(to panModalGestureRecognizer: UIPanGestureRecognizer) -> Bool {
    if (hiding) {
      return false
    }
    return self.config!.dismissable
  }

  var allowsDragToDismiss: Bool {
    return self.config?.allowsDragToDismiss ?? false
  }

  var allowsTapToDismiss: Bool {
    return self.config?.allowsTapToDismiss ?? false
  }

  var anchorModalToLongForm: Bool {
    return self.config?.anchorModalToLongForm ?? false
  }
  
  var relevantScrollViewDepth: Int {
    return self.config?.relevantScrollViewDepth.intValue ?? 1
  }

  var panModalBackgroundColor: UIColor {
    let backgroundColor: UIColor = self.config?.modalBackgroundColor ?? UIColor.black
    return backgroundColor.withAlphaComponent(CGFloat(truncating: self.config?.backgroundOpacity ?? 1))
  }

  var scrollIndicatorInsets: UIEdgeInsets {
    let top = shouldRoundTopCorners ? cornerRadius : 0
    let bottom = ignoreBottomOffset ? 0 : bottomLayoutOffset
    return UIEdgeInsets(top: CGFloat(top), left: 0, bottom: bottom, right: 0)
  }

  func shouldPrioritize(panModalGestureRecognizer: UIPanGestureRecognizer) -> Bool {
    let headerHeight: CGFloat = CGFloat(truncating: self.config!.headerHeight)

    var locationY = panModalGestureRecognizer.location(in: view).y

    /// HACK

    let initialLocationAbsY = (panModalGestureRecognizer as! UIPanGestureRecognizerWithInitialPosition).initialTouchLocation.y;
    let currLocationAbsY = panModalGestureRecognizer.location(in: view.superview!.superview).y

    let displacementY = currLocationAbsY - initialLocationAbsY

    locationY -= displacementY

    // END HACK

    return locationY < headerHeight
  }

  var isShortFormEnabledInternal = 2
  var hasAskedAboutShortForm = 2;
  var isShortFormEnabled: Bool {
    hasAskedAboutShortForm -= 1;
    let startFromShortForm = self.config?.startFromShortForm ?? true;
    if isShortFormEnabledInternal > 0 && !startFromShortForm {
      isShortFormEnabledInternal -= 1
      return false
    }
    return self.config?.isShortFormEnabled ?? true
  }

  var shortFormHeight: PanModalHeight {
    let height: CGFloat = CGFloat(truncating: self.config?.shortFormHeight ?? 0.0)
    return (isShortFormEnabled && !forceDisableShortForm) ? .contentHeight(height) : longFormHeight
  }

  var springDamping: CGFloat {
    return CGFloat(truncating: self.config?.springDamping ?? 0)
  }

  var transitionDuration: Double {
    return Double(truncating: self.config?.transitionDuration ?? 300)
  }

  var showDragIndicator: Bool {
    return config?.showDragIndicator ?? false
  }

  var topOffset: CGFloat {
    return CGFloat(truncating: config?.topOffset ?? 0)
  }

  var panScrollable: UIScrollView? {
    if !(self.config?.interactWithScrollView ?? false){
      return nil
    }
    return findChildScrollViewDFS(view: self.view!)
  }

  var longFormHeight: PanModalHeight {
    return .contentHeight(CGFloat(truncating: self.config?.longFormHeight ?? 0.0))
  }

  func panModalDidDismiss() {
    if config?.customStack ?? false {
      config?.removeController()
    }
    config = nil
    
    let isSlack = self.presentingViewController?.responds(to: NSSelectorFromString("unhackParent")) ?? false
    
    if isSlack {
      let parentConfig: RNCMScreenView? = self.presentingViewController?.value(forKey: "config") as? RNCMScreenView
      let isHidden: Bool = parentConfig?.value(forKey: "_hidden") as? Bool ?? false
      if (isHidden) {
        self.presentingViewController!.dismiss(animated: false)
      }
    }
  }

  override func viewDidAppear(_ animated: Bool) {
    config?.notifyAppear()
  }

  override func viewWillDisappear(_ animated: Bool) {
    if !self.config!.customStack {
      config?.removeController()
    }
    disappared = true
    super.viewWillDisappear(animated)
  }

  var prevHeight: CGFloat = 0;
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    for i in 1...10 {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3 * Double(i)) {
        if !self.disappared {
          let newHeight: CGFloat = self.panScrollable?.layer.frame.height ?? 0
          if !newHeight.isEqual(to: self.prevHeight) {
            self.prevHeight = newHeight
            self.panModalSetNeedsLayoutUpdate()
          }
        }
      }
    }
  }
}


extension UIViewController {
  @objc public func obtainDelegate() -> UIViewControllerTransitioningDelegate? {
    let delegate = PanModalPresentationDelegate.default
    return delegate
  }

  @objc public func presentModally(_ viewControllerToPresent: UIViewController,
                                   animated flag: Bool,
                                   completion: (() -> Void)? = nil,
                                   slackStack:Bool) -> Void

  {
    let controller = PanModalViewController(viewControllerToPresent)
    if self is PanModalViewController {
      print((self as! PanModalViewController).hacked)
      (self as! PanModalViewController).unhackParent()
    }
    
    controller.transitioningDelegate = slackStack ? viewControllerToPresent.transitioningDelegate : nil
    controller.modalPresentationStyle = slackStack ? viewControllerToPresent.modalPresentationStyle : .pageSheet
    self.present(controller, animated: flag, completion: completion)
  }
}
