import PanModal
import UIKit

final class PanModalViewController: UIViewController, PanModalPresentable {
  private var screen: RNCMScreen?
  private var config: RNCMScreenView? { screen?.screenView }
  private var state: PanModalPresentationController.PresentationState
  private var forceDisableShortForm = false
  private var isShortFormEnabledInternal = 2
  private weak var selectedScrollView: UIScrollView?

  @objc private(set) var hiding = false
  @objc var dismissing: Bool { (presentationController as? PanModalPresentationController)?.isDismissing ?? isBeingDismissed }

  init(screen: RNCMScreen) {
    self.screen = screen
    state = screen.screenView.startFromShortForm ? .shortForm : .longForm
    super.init(nibName: nil, bundle: nil)

    let content = screen.screenView
    let root = UIView(frame: content.bounds)
    root.backgroundColor = .clear
    root.isOpaque = false
    view = root
    addChild(screen)
    content.frame = root.bounds
    content.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    root.addSubview(content)
    screen.didMove(toParent: self)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is unavailable")
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
      return state == .hidden ? (config?.startFromShortForm == true ? .shortForm : .longForm) : state
    })
  }

  @objc func setNeedsPanModalLayoutUpdate() {
    panModalSetNeedsLayoutUpdate()
  }

  func willTransition(to state: PanModalPresentationController.PresentationState) {
    if state == .longForm, !forceDisableShortForm, config?.disableShortFormAfterTransitionToLongForm == true {
      forceDisableShortForm = true
      panModalSetNeedsLayoutUpdate()
    }
    self.state = state
  }

  func onTouchTop(_ dismissing: Bool) {
    config?.notifyTouchTop(dismissing)
  }

  var cornerRadius: CGFloat {
    if config?.cornerRadius == 0.666 {
      return UIScreen.main.displayCornerRadius
    }
    return CGFloat(truncating: config?.cornerRadius ?? 0)
  }

  var ignoreBottomOffset: Bool {
    return config?.ignoreBottomOffset ?? false
  }

  let isHapticFeedbackEnabled = false

  func willReceivePanTouch(_ touch: UITouch) {
    guard config?.interactWithScrollView == true else {
      selectedScrollView = nil
      return
    }

    var ancestor = touch.view?.isDescendant(of: view) == true ? touch.view : nil
    while let candidate = ancestor, candidate !== view {
      if let scrollView = candidate as? UIScrollView, canScrollVertically(scrollView) {
        selectedScrollView = scrollView
        return
      }
      ancestor = candidate.superview
    }

    // A header drag can still interrupt the previously active list. Keep it
    // only while its page remains visible and interactive; never pick a sibling.
    if let scrollView = selectedScrollView,
       !canScrollVertically(scrollView) || !isScrollViewVisible(scrollView) {
      selectedScrollView = nil
    }
  }

  private func canScrollVertically(_ scrollView: UIScrollView) -> Bool {
    guard scrollView.isScrollEnabled, scrollView.panGestureRecognizer.isEnabled else { return false }
    let insets = scrollView.adjustedContentInset
    if scrollView.contentSize.height + insets.top + insets.bottom > scrollView.bounds.height {
      return true
    }
    guard scrollView.alwaysBounceVertical else { return false }
    if #available(iOS 17.4, *) {
      return scrollView.bouncesVertically
    }
    return scrollView.bounces
  }

  private func isScrollViewVisible(_ scrollView: UIScrollView) -> Bool {
    guard scrollView.isDescendant(of: view), scrollView.window != nil,
          scrollView.convert(scrollView.bounds, to: view).intersects(view.bounds) else { return false }
    var ancestor: UIView? = scrollView
    while let candidate = ancestor {
      if candidate.isHidden || candidate.alpha <= 0.01 || !candidate.isUserInteractionEnabled { return false }
      if candidate === view { return true }
      ancestor = candidate.superview
    }
    return false
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
    return config?.allowsDragToDismiss ?? false
  }

  var allowsTapToDismiss: Bool {
    return config?.allowsTapToDismiss ?? false
  }

  var anchorModalToLongForm: Bool {
    return config?.anchorModalToLongForm ?? false
  }

  var panModalBackgroundColor: UIColor {
    let backgroundColor = config?.modalBackgroundColor ?? .black
    return backgroundColor.withAlphaComponent(CGFloat(truncating: config?.backgroundOpacity ?? 1))
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

  var isShortFormEnabled: Bool {
    let startFromShortForm = config?.startFromShortForm ?? true
    if isShortFormEnabledInternal > 0 && !startFromShortForm {
      isShortFormEnabledInternal -= 1
      return false
    }
    return config?.isShortFormEnabled ?? true
  }

  var shortFormHeight: PanModalHeight {
    let height = CGFloat(truncating: config?.shortFormHeight ?? 0)
    return (isShortFormEnabled && !forceDisableShortForm) ? .contentHeight(height) : longFormHeight
  }

  var springDamping: CGFloat {
    return CGFloat(truncating: config?.springDamping ?? 0)
  }

  var transitionDuration: Double {
    return Double(truncating: config?.transitionDuration ?? 300)
  }

  var topOffset: CGFloat {
    return CGFloat(truncating: config?.topOffset ?? 0)
  }

  var panScrollable: UIScrollView? {
    return config?.interactWithScrollView == true ? selectedScrollView : nil
  }

  var longFormHeight: PanModalHeight {
    return .contentHeight(CGFloat(truncating: config?.longFormHeight ?? 0))
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    guard isBeingDismissed || presentingViewController == nil,
          let screen = screen, screen.parent === self else { return }
    let config = screen.screenView
    self.screen = nil
    selectedScrollView = nil
    screen.willMove(toParent: nil)
    screen.view.removeFromSuperview()
    screen.removeFromParent()
    (config.reactSuperview() as? RNCMScreenStackView)?.screenDidDisappear(config)
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    config?.notifyAppear()
  }

  override func viewWillDisappear(_ animated: Bool) {
    if isBeingDismissed && !(presentationController is PanModalPresentationController) {
      config?.willDismiss()
    }

    super.viewWillDisappear(animated)
  }
}

extension UIViewController {
  @objc public func obtainDelegate() -> UIViewControllerTransitioningDelegate? {
    return PanModalPresentationDelegate.default
  }

  @objc public func presentModally(
    _ viewControllerToPresent: RNCMScreen,
    animated flag: Bool,
    completion: (() -> Void)? = nil,
    slackStack: Bool
  ) {
    let controller = PanModalViewController(screen: viewControllerToPresent)

    controller.transitioningDelegate = slackStack ? viewControllerToPresent.transitioningDelegate : nil
    controller.modalPresentationStyle = slackStack ? viewControllerToPresent.modalPresentationStyle : .pageSheet
    present(controller, animated: flag, completion: completion)
  }
}
