//
//  Button.swift
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

class Button : RCTView {
  @objc lazy var onPress: RCTBubblingEventBlock = { _ in }
  @objc lazy var onPressStart: RCTBubblingEventBlock = { _ in }
  @objc lazy var onLongPress: RCTBubblingEventBlock? = nil;
  @objc var disabled: Bool = false {
    didSet {
      isUserInteractionEnabled = !disabled
    }
  }
  @objc var duration: TimeInterval = 0.1
  @objc var pressOutDuration: TimeInterval = -1
  @objc var scaleTo: CGFloat = 0.97
  @objc var transformOrigin: CGPoint = CGPoint(x: 0.5, y: 0.5)
  @objc var enableHapticFeedback: Bool = true
  @objc var hapticType: String = "selection"
  @objc var useLateHaptic: Bool = true
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
        onLongPress!([:])
      default: break
      }
    }
  }
  
  var longPress: UILongPressGestureRecognizer? = nil
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    
    if onLongPress != nil {
      longPress = UILongPressGestureRecognizer(target: self, action: #selector(onLongPressHandler(_:)))
      addGestureRecognizer(longPress!)
    }
    isUserInteractionEnabled = true
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapStart(
      duration: duration,
      scale: scaleTo,
      transformOrigin: transformOrigin,
      useHaptic: useLateHaptic ? nil : hapticType
    )
    onPressStart([:])
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    let useHaptic = useLateHaptic && enableHapticFeedback ? hapticType : nil
    animateTapEnd(duration: pressOutDuration == -1 ? duration : pressOutDuration, useHaptic: useHaptic)
    onPress([:])
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: pressOutDuration == -1 ? duration : pressOutDuration)
  }
}
