
import PanModal

@objc public protocol PanModalViewControllerScreen: NSObjectProtocol {
    @objc var panModalViewController: PanModalViewController? { get }
    @objc var allowsDragToDismiss: Bool { get }
    @objc var allowsTapToDismiss: Bool { get }
    @objc var anchorModalToLongForm: Bool { get }
    @objc var backgroundOpacity: NSNumber { get }
    @objc var cornerRadius: NSNumber { get }
    @objc var customStack: Bool { get }
    @objc var disableShortFormAfterTransitionToLongForm: Bool { get }
    @objc var interactWithScrollView: Bool { get }
    @objc var isShortFormEnabled: Bool { get }
    @objc var longFormHeight: NSNumber { get }
    @objc var modalBackgroundColor: UIColor { get }
    @objc var relevantScrollViewDepth: NSNumber { get }
    @objc var shortFormHeight: NSNumber { get }
    @objc var showDragIndicator: Bool { get }
    @objc var springDamping: NSNumber { get }
    @objc var startFromShortForm: Bool { get }
    @objc var topOffset: NSNumber { get }
    @objc var transitionDuration: NSNumber { get }
    @objc var ignoreBottomOffset: Bool { get }
    @objc var dismissable: Bool { get }
    @objc var headerHeight: NSNumber { get }

    @objc func notifyAppear()
    @objc func willDismiss()
    @objc func invalidateImpl()
    @objc func onTouchTopWrapper(_ dismissing: NSNumber)
}

extension UIScreen {
    private static let cornerRadiusKey: String = {
        let components = ["Radius", "Corner", "display", "_"]
        return components.reversed().joined()
    }()

    public var displayCornerRadius: CGFloat {
        guard let cornerRadius = self.value(forKey: Self.cornerRadiusKey) as? CGFloat else {
            return 0
        }
        
        return cornerRadius
    }
}

public extension UIView {
  @objc func newHitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    if (self.superview!.superview == nil && self.subviews.count == 2 && self.subviews[1] is PanModal.PanContainerView) {
      let container = self.subviews[1]
      if let screen = container.subviews.first as? PanModalViewControllerScreen {
        let hacked = screen.panModalViewController?.hacked ?? false
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

public class PanModalViewController: UIViewController, PanModalPresentable, UILayoutSupport {
  static var swizzled = false
  var config : (UIView & PanModalViewControllerScreen)?
  public var length: CGFloat = 0
  public var topAnchor: NSLayoutYAxisAnchor = NSLayoutYAxisAnchor.init()
  public var bottomAnchor: NSLayoutYAxisAnchor = NSLayoutYAxisAnchor.init()
  public var heightAnchor: NSLayoutDimension = NSLayoutDimension.init()
  var state: PanModalPresentationController.PresentationState? = nil;
  var disappeared = false
  var hiding = false
  var didHandleWillDismiss = false
  var ppview: UIView?

  weak var viewController: UIViewController?
  var panScrollableCache: UIScrollView?

  convenience init(_ viewControllerToPresent: UIViewController) {
    self.init(nibName: nil, bundle: nil)

    viewControllerToPresent.setValue(self, forKey: "_parentVC")
    viewController = viewControllerToPresent
    config = (viewControllerToPresent.view as! (UIView & PanModalViewControllerScreen))
    state = (config?.startFromShortForm ?? false) ? PanModalPresentationController.PresentationState.shortForm : PanModalPresentationController.PresentationState.longForm;
  }

  @objc public func hide() {
    hiding = true
    hackParent()
    panModalTransition(to: .hidden)
  }

  @objc public func jumpTo(long: NSNumber) {
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

  @objc public func rejump() {
    self.panModalSetNeedsLayoutUpdate()
    self.panModalTransition(to: self.state!)
  }

  @objc public func panModalSetNeedsLayoutUpdateWrapper() {
    panModalSetNeedsLayoutUpdate()
  }

  var forceDisableShortForm = false

  public func willTransition(to state: PanModalPresentationController.PresentationState) {
    if state == .longForm && config?.disableShortFormAfterTransitionToLongForm ?? false {
      forceDisableShortForm = true
      self.panModalSetNeedsLayoutUpdate()
    }
    self.state = state;
  }


  @objc public func unhackParent() {
    self.hacked = false
    self.ppview = nil
  }


  public func onTouchTop(_ dismissing: Bool) {
    let selector = NSSelectorFromString("onTouchTopWrapper:")
    config?.perform(selector, with: NSNumber.init(value: dismissing))
  }

  override public var bottomLayoutGuide: UILayoutSupport {
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
    guard let ppview = config?.superview?.superview else { return }
    hacked = true
    self.ppview = ppview
    let poldClass: AnyClass = type(of: self.ppview!)
    if !PanModalViewController.swizzled {
      self.originalMethod = class_getInstanceMethod(poldClass, #selector(UIView.hitTest(_:with:)))
      let swizzledMethod = class_getInstanceMethod(poldClass, #selector(UIView.newHitTest(_:with:)))
      method_exchangeImplementations(self.originalMethod!, swizzledMethod!)
      PanModalViewController.swizzled = true
    }
  }

  public var cornerRadius: CGFloat {
    if (self.config?.cornerRadius == 0.666) {
      return UIScreen.main.displayCornerRadius
    }
    return CGFloat(truncating: self.config?.cornerRadius ?? 0)
  }

  public var ignoreBottomOffset: Bool {
    return self.config!.ignoreBottomOffset;
  }

  public var isHapticFeedbackEnabled: Bool = false

  func findChildScrollViewDFS(view: UIView)-> UIScrollView? {
    if panScrollableCache != nil {
      return panScrollableCache
    }
    var foundScrollViews = 0
    var viewsToTraverse = [view]
    while !viewsToTraverse.isEmpty {
      let last = viewsToTraverse.last!
      viewsToTraverse.removeLast()
      let maybeScrollView = last as? UIScrollView
      if maybeScrollView?.isScrollEnabled == true {
        foundScrollViews += 1
        if foundScrollViews == relevantScrollViewDepth {
          panScrollableCache = maybeScrollView
          return maybeScrollView
        }
      }
      last.subviews.forEach { subview in
        viewsToTraverse.append(subview)
      }
    }
    return nil
  }

  override public var view: UIView! {
    get {
      if (viewController == nil) {
        return UIView()
      }
      return viewController!.view
    }
    set {

    }
  }

  public func panModalWillDismiss() {
    if !didHandleWillDismiss {
      didHandleWillDismiss = true
      callWillDismiss()
    }
  }

  @objc func callWillDismiss() {
    config?.willDismiss()
  }

  public func shouldRespond(to panModalGestureRecognizer: UIPanGestureRecognizer) -> Bool {
    if (hiding) {
      return false
    }
    return self.config!.dismissable || self.shouldPrioritize(panModalGestureRecognizer: panModalGestureRecognizer)
  }

  public var allowsDragToDismiss: Bool {
    return self.config?.allowsDragToDismiss ?? false
  }

  public var allowsTapToDismiss: Bool {
    return self.config?.allowsTapToDismiss ?? false
  }

  public var anchorModalToLongForm: Bool {
    return self.config?.anchorModalToLongForm ?? false
  }

  var relevantScrollViewDepth: Int {
    return self.config?.relevantScrollViewDepth.intValue ?? 1
  }

  public var panModalBackgroundColor: UIColor {
    let backgroundColor: UIColor = self.config?.modalBackgroundColor ?? UIColor.black
    return backgroundColor.withAlphaComponent(CGFloat(truncating: self.config?.backgroundOpacity ?? 1))
  }

  public var scrollIndicatorInsets: UIEdgeInsets {
    guard let scrollView = panScrollable else {
      return UIEdgeInsets(
        top: shouldRoundTopCorners ? cornerRadius : 0,
        left: 0,
        bottom: ignoreBottomOffset ? 0 : bottomLayoutOffset,
        right: 0
      )
    }

    let currentInsets = if #available(iOS 13.0, *) {
      scrollView.verticalScrollIndicatorInsets
    } else {
      scrollView.scrollIndicatorInsets
    }

    return UIEdgeInsets(
      top: max(currentInsets.top, shouldRoundTopCorners ? cornerRadius : 0),
      left: currentInsets.left,
      bottom: max(currentInsets.bottom, ignoreBottomOffset ? 0 : bottomLayoutOffset),
      right: currentInsets.right
    )
  }

  public func shouldPrioritize(panModalGestureRecognizer: UIPanGestureRecognizer) -> Bool {
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

  public var shortFormHeight: PanModalHeight {
    let height: CGFloat = CGFloat(truncating: self.config?.shortFormHeight ?? 0.0)
    return (isShortFormEnabled && !forceDisableShortForm) ? .contentHeight(height) : longFormHeight
  }

  public var springDamping: CGFloat {
    return CGFloat(truncating: self.config?.springDamping ?? 0)
  }

  public var transitionDuration: Double {
    return Double(truncating: self.config?.transitionDuration ?? 300)
  }

  public var showDragIndicator: Bool {
    return config?.showDragIndicator ?? false
  }

  public var topOffset: CGFloat {
    return CGFloat(truncating: config?.topOffset ?? 0)
  }

  public var panScrollable: UIScrollView? {
    if !(self.config?.interactWithScrollView ?? false){
      return nil
    }
    return findChildScrollViewDFS(view: self.view!)
  }

  public var longFormHeight: PanModalHeight {
    return .contentHeight(CGFloat(truncating: self.config?.longFormHeight ?? 0.0))
  }

  public func panModalDidDismiss() {
    if config?.customStack ?? false {
      config?.invalidateImpl()
    }
    config = nil

    let isSlack = self.presentingViewController?.responds(to: NSSelectorFromString("unhackParent")) ?? false

    if isSlack {
      let isHidden: Bool = (self.presentingViewController as? PanModalViewController)?.config?.isHidden ?? false
      if (isHidden) {
        self.presentingViewController!.dismiss(animated: false)
      }
    }
  }

  override public func viewDidAppear(_ animated: Bool) {
    didHandleWillDismiss = false
    config?.notifyAppear()
  }

  override public func viewWillDisappear(_ animated: Bool) {
    if self.isBeingDismissed && !didHandleWillDismiss {
      didHandleWillDismiss = true
      callWillDismiss()
    }

    if !self.config!.customStack {
      config?.invalidateImpl()
    }
    disappeared = true
    super.viewWillDisappear(animated)
  }

  var prevHeight: CGFloat = 0;
  override public func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    for i in 1...10 {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3 * Double(i)) {
        if !self.disappeared {
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
      (self as! PanModalViewController).unhackParent()
    }

    controller.transitioningDelegate = slackStack ? viewControllerToPresent.transitioningDelegate : nil
    controller.modalPresentationStyle = slackStack ? viewControllerToPresent.modalPresentationStyle : .pageSheet
    self.present(controller, animated: flag, completion: completion)
  }
}
