
import PanModal
import UIKit


class PanModalViewController: UIViewController, PanModalPresentable, UILayoutSupport {
  @objc var config : RNCMScreenView?
  var length: CGFloat = 0
  var topAnchor: NSLayoutYAxisAnchor = NSLayoutYAxisAnchor.init()
  var bottomAnchor: NSLayoutYAxisAnchor = NSLayoutYAxisAnchor.init()
  var heightAnchor: NSLayoutDimension = NSLayoutDimension.init()
  var state: PanModalPresentationController.PresentationState? = nil;
  @objc private(set) var hiding = false
  @objc var dismissing: Bool { (presentationController as? PanModalPresentationController)?.isDismissing ?? isBeingDismissed }

  weak var viewController: UIViewController?
  private weak var selectedScrollView: UIScrollView?

  convenience init(_ viewControllerToPresent: UIViewController) {
    self.init(nibName: nil, bundle: nil)

    viewControllerToPresent.setValue(self, forKey: "_parentVC")
    viewController = viewControllerToPresent
    config = (viewControllerToPresent.view as! RNCMScreenView)
    state = (config?.startFromShortForm ?? false) ? PanModalPresentationController.PresentationState.shortForm : PanModalPresentationController.PresentationState.longForm;
  }

  @objc func hide() {
    guard !hiding else { return }
    hiding = true
    panModalTransition(to: .hidden)
  }

  @objc func dismissPanModal(animated: Bool, completion: @escaping () -> Void) {
    panModalDismiss(animated: animated, completion: completion)
  }

  @objc func restorePresentation() {
    guard presentationController is PanModalPresentationController else { return }
    panModalSetNeedsLayoutUpdate(transitionTo: {
      hiding = false
      return state == .hidden ? (config?.startFromShortForm == true ? .shortForm : .longForm) : state ?? .longForm
    })
  }

  @objc func panModalSetNeedsLayoutUpdateWrapper() {
    panModalSetNeedsLayoutUpdate()
  }
  
  var forceDisableShortForm = false
  
  func willTransition(to state: PanModalPresentationController.PresentationState) {
    if state == .longForm, !forceDisableShortForm, config?.disableShortFormAfterTransitionToLongForm == true {
      forceDisableShortForm = true
      self.panModalSetNeedsLayoutUpdate()
    }
    self.state = state;
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

  func willReceivePanTouch(_ touch: UITouch) {
    guard config?.interactWithScrollView == true else {
      selectedScrollView = nil
      return
    }

    var ancestor = touch.view?.isDescendant(of: view) == true ? touch.view : nil
    while let candidate = ancestor, candidate !== view {
      if let scrollView = candidate as? UIScrollView,
         scrollView.isScrollEnabled, scrollView.panGestureRecognizer.isEnabled,
         scrollView.alwaysBounceVertical ||
           scrollView.contentSize.height + scrollView.adjustedContentInset.top + scrollView.adjustedContentInset.bottom > scrollView.bounds.height {
        selectedScrollView = scrollView
        return
      }
      ancestor = candidate.superview
    }

    // A header drag can still interrupt the previously active list. Keep it
    // only while its page remains visible and interactive; never pick a sibling.
    if let scrollView = selectedScrollView, !isScrollViewVisible(scrollView) {
      selectedScrollView = nil
    }
  }

  private func isScrollViewVisible(_ scrollView: UIScrollView) -> Bool {
    guard scrollView.isScrollEnabled, scrollView.panGestureRecognizer.isEnabled,
          scrollView.isDescendant(of: view), scrollView.window != nil,
          scrollView.convert(scrollView.bounds, to: view).intersects(view.bounds) else { return false }
    var ancestor: UIView? = scrollView
    while let candidate = ancestor {
      if candidate.isHidden || candidate.alpha <= 0.01 || !candidate.isUserInteractionEnabled { return false }
      if candidate === view { return true }
      ancestor = candidate.superview
    }
    return false
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
    config?.willDismiss()
  }

  func shouldRespond(to panModalGestureRecognizer: UIPanGestureRecognizer, isPrioritized: Bool) -> Bool {
    guard !hiding, let config = config else { return false }
    guard config.inStack, !config.skipsOnReturn else { return false }
    return config.dismissable || isPrioritized
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
  
  var panModalBackgroundColor: UIColor {
    let backgroundColor: UIColor = self.config?.modalBackgroundColor ?? UIColor.black
    return backgroundColor.withAlphaComponent(CGFloat(truncating: self.config?.backgroundOpacity ?? 1))
  }

  var scrollIndicatorInsets: UIEdgeInsets {
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

  func shouldPrioritizePan(at location: CGPoint) -> Bool {
    return location.y < CGFloat(truncating: config?.headerHeight ?? 0)
  }

  var isShortFormEnabledInternal = 2
  var isShortFormEnabled: Bool {
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


  var topOffset: CGFloat {
    return CGFloat(truncating: config?.topOffset ?? 0)
  }

  var panScrollable: UIScrollView? {
    if !(self.config?.interactWithScrollView ?? false){
      return nil
    }
    return selectedScrollView
  }

  var longFormHeight: PanModalHeight {
    return .contentHeight(CGFloat(truncating: self.config?.longFormHeight ?? 0.0))
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    guard isBeingDismissed || presentingViewController == nil, let config = config else { return }
    (config.reactSuperview() as? RNCMScreenStackView)?.screenDidDisappear(config)
    if (viewController as? RNCMScreen)?.parentVC() === self {
      viewController?.setValue(nil, forKey: "_parentVC")
    }
    self.config = nil
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    config?.notifyAppear()
  }

  override func viewWillDisappear(_ animated: Bool) {
    if self.isBeingDismissed && !(presentationController is PanModalPresentationController) {
      config?.willDismiss()
    }

    super.viewWillDisappear(animated)
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
    
    controller.transitioningDelegate = slackStack ? viewControllerToPresent.transitioningDelegate : nil
    controller.modalPresentationStyle = slackStack ? viewControllerToPresent.modalPresentationStyle : .pageSheet
    self.present(controller, animated: flag, completion: completion)
  }
}
