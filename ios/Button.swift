//
//  Button.swift
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

class Button : RCTView {
  @objc lazy var onPress: RCTBubblingEventBlock = { _ in }
  @objc lazy var onCancel: RCTBubblingEventBlock = { _ in }
  @objc lazy var onPressStart: RCTBubblingEventBlock = { _ in }
  @objc lazy var onLongPress: RCTBubblingEventBlock = { _ in };
  @objc lazy var onLongPressEnded: RCTBubblingEventBlock = { _ in };
  @objc var disabled: Bool = false {
    didSet {
      isUserInteractionEnabled = !disabled
    }
  }
  @objc var duration: TimeInterval = 0.16
  @objc var pressOutDuration: TimeInterval = -1
  @objc var scaleTo: CGFloat = 0.97
  @objc var transformOrigin: CGPoint = CGPoint(x: 0.5, y: 0.5) {
    didSet {
      self.setAnchorPoint(CGPoint(x: transformOrigin.x, y: transformOrigin.y))
    }
  }
  @objc var enableHapticFeedback: Bool = true
  @objc var hapticType: String = "selection"
  @objc var useLateHaptic: Bool = true
  @objc var throttle: Bool = false
  @objc var shouldLongPressHoldPress: Bool = false

  var blocked: Bool = false
  var invalidated: Bool = false;

  @objc var minLongPressDuration: TimeInterval = 0.5 {
    didSet {
      if longPress != nil {
        longPress!.minimumPressDuration = minLongPressDuration
      }
    }
  }

  @objc func onLongPressHandler(_ sender: UIGestureRecognizer? = nil) {
    if sender != nil {
      switch sender!.state {
      case .began:
        onLongPress([:])
      case .ended:
        if shouldLongPressHoldPress {
            onLongPressEnded([:])
            animator = animateTapEnd(duration: pressOutDuration == -1 ? duration : pressOutDuration)
        }
      default: break
      }
    }
  }

  var longPress: UILongPressGestureRecognizer? = nil
  var tapLocation: CGPoint? = nil
  var animator: UIViewPropertyAnimator? = nil
  let touchMoveTolerance: CGFloat = 80.0

  override init(frame: CGRect) {
    super.init(frame: frame)

    self.isAccessibilityElement = true

    longPress = UILongPressGestureRecognizer(target: self, action: #selector(onLongPressHandler(_:)))
    addGestureRecognizer(longPress!)
    isUserInteractionEnabled = true
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    if let touch = touches.first {
      self.tapLocation = touch.location(in: self)
    }
    if blocked {
      invalidated = true
      return;
    }
    invalidated = false
    animator = animateTapStart(
      duration: duration,
      scale: scaleTo,
      useHaptic: useLateHaptic ? nil : hapticType
    )
    if shouldLongPressHoldPress {
      onPress([:])
    } else {
      onPressStart([:])
    }
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    if invalidated {
      return
    }
    if let touch = touches.first {
      let location = touch.location(in: self)
      if animator?.isRunning ?? false {
        return
      }
      if !touchInRange(location: location, tolerance: self.touchMoveTolerance) {
        animator = animateTapEnd(duration: duration)
      } else if touchInRange(location: location, tolerance: self.touchMoveTolerance * 0.8) {
        animator = animateTapStart(
          duration: duration,
          scale: scaleTo
        )
      }
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    if invalidated {
      return
    }
    if let touch = touches.first {
      let location = touch.location(in: self)
      if touchInRange(location: location, tolerance: self.touchMoveTolerance * 0.8) {
          let useHaptic = useLateHaptic && enableHapticFeedback ? hapticType : nil
          animator = animateTapEnd(duration: pressOutDuration == -1 ? duration : pressOutDuration, useHaptic: useHaptic)
          if shouldLongPressHoldPress == false {
            onPress([:])
          }
          if throttle {
            blocked = true;
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
              self.blocked = false;
            }
          }
      } else {
        self.touchesCancelled(touches, with: event)
      }
    }
  }

  static func isClose(locationA:CGPoint, locationB: CGPoint) -> Bool {
    if (abs(locationA.x - locationB.x) > 5) {
      return false
    }

    if (abs(locationA.y - locationB.y) > 5) {
      return false
    }

    return true
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    if invalidated {
      return
    }
    if let touch = touches.first {
      let location = touch.location(in: self)
      onCancel(["close":Button.isClose(locationA: location, locationB: tapLocation!), "state": self.longPress?.value(forKey: "_state")])
    }
    if shouldLongPressHoldPress == false {
      animator = animateTapEnd(duration: pressOutDuration == -1 ? duration : pressOutDuration)
    }
    if throttle {
      blocked = true;
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        self.blocked = false;
      }
    }
  }

  private func touchInRange(location: CGPoint, tolerance: CGFloat) -> Bool {
    return (
      (self.tapLocation!.x - tolerance)...(self.tapLocation!.x + tolerance) ~= location.x &&
      (self.tapLocation!.y - tolerance)...(self.tapLocation!.y + tolerance) ~= location.y
    )
  }
}
