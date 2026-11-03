//
//  Button.swift
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

class Button: RCTView {
  @objc var onPress: RCTDirectEventBlock?
  @objc var onCancel: RCTDirectEventBlock?
  @objc var onPressStart: RCTDirectEventBlock?
  @objc var onLongPress: RCTDirectEventBlock?
  @objc var onLongPressEnded: RCTDirectEventBlock?
  @objc var disabled: Bool = false {
    didSet {
      isUserInteractionEnabled = !disabled
      longPress?.isEnabled = !disabled
      if disabled {
        invalidated = true
        isPressEligible = false
        touchStartInWindow = nil
        animate(to: .identity, duration: releaseDuration)
      }
    }
  }
  @objc var duration: TimeInterval = 0.16
  @objc var pressOutDuration: TimeInterval = -1
  @objc var scaleTo: CGFloat = 0.86
  @objc var transformOrigin = CGPoint(x: 0.5, y: 0.5)
  @objc var enableHapticFeedback: Bool = true
  @objc var hapticType: String = "selection" {
    didSet {
      haptic = ButtonHaptic(hapticType)
    }
  }
  @objc var useLateHaptic: Bool = true
  @objc var throttle: Bool = false
  @objc var shouldLongPressHoldPress: Bool = false
  @objc var minLongPressDuration: TimeInterval = 0.5

  private var blockedUntil: CFTimeInterval = 0
  private var haptic: ButtonHaptic = .selection
  private var invalidated: Bool = false
  private var longPress: UILongPressGestureRecognizer?
  private var isPressEligible = false
  private var touchStartInWindow: CGPoint?
  private static let pressRetentionOutset: CGFloat = 20

  private var releaseDuration: TimeInterval {
    pressOutDuration == -1 ? duration : pressOutDuration
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    isAccessibilityElement = true
    isUserInteractionEnabled = true
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func didSetProps(_ changedProps: [String]!) {
    super.didSetProps(changedProps)

    if onLongPress != nil || onLongPressEnded != nil || onCancel != nil || shouldLongPressHoldPress {
      if let longPress = longPress {
        if longPress.minimumPressDuration != minLongPressDuration {
          longPress.minimumPressDuration = minLongPressDuration
        }
      } else {
        let recognizer = UILongPressGestureRecognizer(target: self, action: #selector(onLongPressHandler(_:)))
        recognizer.minimumPressDuration = minLongPressDuration
        recognizer.isEnabled = !disabled
        addGestureRecognizer(recognizer)
        longPress = recognizer
      }
    } else if let recognizer = longPress {
      removeGestureRecognizer(recognizer)
      longPress = nil
    }
  }

  @objc private func onLongPressHandler(_ sender: UIGestureRecognizer) {
    switch sender.state {
    case .began:
      onLongPress?([:])
    case .ended, .cancelled:
      if shouldLongPressHoldPress {
        onLongPressEnded?([:])
        animate(to: .identity, duration: releaseDuration)
      }
    default:
      break
    }
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    invalidated = CACurrentMediaTime() < blockedUntil
    isPressEligible = !invalidated
    touchStartInWindow = invalidated ? nil : touches.first?.location(in: nil)
    if invalidated { return }
    if !useLateHaptic && enableHapticFeedback {
      haptic.generate()
    }
    animatePress()
    if shouldLongPressHoldPress {
      onPress?([:])
    } else {
      onPressStart?([:])
    }
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard !invalidated, let touch = touches.first else { return }
    let eligible = isTouchWithinPressRegion(touch)
    guard eligible != isPressEligible else { return }
    isPressEligible = eligible
    if eligible {
      animatePress()
    } else {
      animate(to: .identity, duration: duration)
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    if invalidated { return }
    if ancestorScrollViewRecognizedPan() {
      touchesCancelled(touches, with: event)
      return
    }
    guard let touch = touches.first else { return }

    if isTouchWithinPressRegion(touch) {
      isPressEligible = false
      touchStartInWindow = nil
      if useLateHaptic && enableHapticFeedback {
        haptic.generate()
      }
      animate(to: .identity, duration: releaseDuration)
      if !shouldLongPressHoldPress {
        onPress?([:])
      }
      if throttle {
        blockedUntil = CACurrentMediaTime() + 0.5
      }
    } else {
      touchesCancelled(touches, with: event)
    }
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    if invalidated { return }
    isPressEligible = false
    let start = touchStartInWindow
    touchStartInWindow = nil
    if let onCancel = onCancel, let touch = touches.first, let start = start {
      let location = touch.location(in: nil)
      onCancel([
        "close": abs(location.x - start.x) <= 5 && abs(location.y - start.y) <= 5,
        "state": (longPress?.state ?? .cancelled).rawValue
      ])
    }
    // The long-press recognizer cancels view touches when it takes ownership.
    let longPressIsActive = longPress?.state == .began || longPress?.state == .changed
    if !shouldLongPressHoldPress || !longPressIsActive {
      animate(to: .identity, duration: releaseDuration)
    }
    if throttle {
      blockedUntil = CACurrentMediaTime() + 0.5
    }
  }

  private func animatePress() {
    let translationX = (1 - scaleTo) * (transformOrigin.x - 0.5) * bounds.width
    let translationY = (1 - scaleTo) * (transformOrigin.y - 0.5) * bounds.height
    animate(to: CGAffineTransform(a: scaleTo, b: 0, c: 0, d: scaleTo, tx: translationX, ty: translationY), duration: duration)
  }

  private func animate(to target: CGAffineTransform, duration: TimeInterval) {
    guard transform != target else { return }
    let animator = UIViewPropertyAnimator(
      duration: duration,
      controlPoint1: CGPoint(x: 0.25, y: 0.46),
      controlPoint2: CGPoint(x: 0.45, y: 0.94)
    ) {
      self.transform = target
    }
    animator.startAnimation()
  }

  private func isTouchWithinPressRegion(_ touch: UITouch) -> Bool {
    let location = touch.location(in: self)
    let anchor = CGPoint(
      x: bounds.minX + bounds.width * layer.anchorPoint.x,
      y: bounds.minY + bounds.height * layer.anchorPoint.y
    )
    // Remove the button's feedback transform from touch coordinates
    let offset = CGPoint(x: location.x - anchor.x, y: location.y - anchor.y).applying(transform)
    let restingLocation = CGPoint(x: anchor.x + offset.x, y: anchor.y + offset.y)
    let hitRect = bounds.inset(by: hitTestEdgeInsets)
    let margin = isPressEligible ? Self.pressRetentionOutset : 0
    return hitRect.insetBy(dx: -margin, dy: -margin).contains(restingLocation)
  }

  private func ancestorScrollViewRecognizedPan() -> Bool {
    var view = superview
    while let ancestor = view {
      if let scrollView = ancestor as? UIScrollView {
        switch scrollView.panGestureRecognizer.state {
        case .began, .changed, .ended, .cancelled:
          return true
        default:
          break
        }
      }
      view = ancestor.superview
    }
    return false
  }
}

private enum ButtonHaptic {
  case selection, error, success, warning, light, medium, heavy

  private static let selectionGenerator = UISelectionFeedbackGenerator()
  private static let notificationGenerator = UINotificationFeedbackGenerator()
  private static let lightGenerator = UIImpactFeedbackGenerator(style: .light)
  private static let mediumGenerator = UIImpactFeedbackGenerator(style: .medium)
  private static let heavyGenerator = UIImpactFeedbackGenerator(style: .heavy)

  init(_ type: String) {
    switch type {
    case "error", "notificationError": self = .error
    case "success", "notificationSuccess": self = .success
    case "warning", "notificationWarning": self = .warning
    case "light", "impactLight": self = .light
    case "medium", "impactMedium": self = .medium
    case "heavy", "impactHeavy": self = .heavy
    default: self = .selection
    }
  }

  func generate() {
    switch self {
    case .selection: Self.selectionGenerator.selectionChanged()
    case .error: Self.notificationGenerator.notificationOccurred(.error)
    case .success: Self.notificationGenerator.notificationOccurred(.success)
    case .warning: Self.notificationGenerator.notificationOccurred(.warning)
    case .light: Self.lightGenerator.impactOccurred()
    case .medium: Self.mediumGenerator.impactOccurred()
    case .heavy: Self.heavyGenerator.impactOccurred()
    }
  }
}
