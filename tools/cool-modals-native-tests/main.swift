import UIKit
import PanModal

@MainActor
final class Trace {
  static var events: [String] = []
  static var checks: [[String: Any]] = []
  static func check(_ name: String, _ pass: Bool, _ detail: String = "") {
    checks.append(["name": name, "pass": pass, "detail": detail])
  }
  static func count(_ event: String) -> Int { events.filter { $0 == event }.count }
}

final class StackProbe: RNCMScreenStackView {
  var terminal: ((RNCMScreenView) -> Void)?
  override func screenDidDisappear(_ screen: RNCMScreenView!) {
    Trace.events.append("stack.terminal")
    terminal?(screen)
  }
}

final class App: UIResponder, UIApplicationDelegate {
  var window: UIWindow!
  let root = UIViewController()
  let bridge = RCTBridge()
  let stack = StackProbe()

  func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)
    window.rootViewController = root
    window.makeKeyAndVisible()
    Task { @MainActor in
      await pause(0.1)
      await run()
      let output: [String: Any] = ["checks": Trace.checks, "events": Trace.events, "os": UIDevice.current.systemVersion]
      let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("result.json")
      try! JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys]).write(to: url, options: .atomic)
    }
    return true
  }

  func pause(_ seconds: Double) async { try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000)) }

  func wait(_ name: String, until condition: () -> Bool) async -> Bool {
    let deadline = CACurrentMediaTime() + 3
    while !condition() && CACurrentMediaTime() < deadline { await pause(0.01) }
    let passed = condition()
    Trace.check(name, passed)
    return passed
  }

  func makeScreen(_ name: String) -> RNCMScreenView {
    let screen = RNCMScreenView(bridge: bridge)!
    screen.stackPresentation = .modal
    screen.longFormHeight = 500
    screen.transitionDuration = 0.12
    screen.cornerRadius = 8
    screen.setValue(stack, forKey: "reactSuperview")
    screen.onAppear = { _ in Trace.events.append(name + ".appear") }
    screen.onWillDismiss = { _ in Trace.events.append(name + ".willDismiss") }
    screen.onDismissed = { _ in Trace.events.append(name + ".dismissed") }
    return screen
  }

  func run() async {
    let screen = makeScreen("primary")
    let child = screen.controller!
    root.presentModally(child, animated: false, completion: { Trace.events.append("present.complete") }, slackStack: true)
    guard await wait("presentation and appearance completed", until: { Trace.count("present.complete") == 1 && Trace.count("primary.appear") == 1 }) else { return }
    guard var wrapper = root.presentedViewController as? PanModalViewController else {
      Trace.check("actual wrapper presented", false)
      return
    }
    Trace.check("actual wrapper presented", wrapper.presentingViewController === root)
    Trace.check("wrapper owns loaded root", wrapper.isViewLoaded && wrapper.viewIfLoaded === wrapper.view)
    Trace.check("wrapper root is distinct from child", wrapper.view !== screen)
    Trace.check("native containment identifies child", child.parent === wrapper && wrapper.children.contains(child))
    Trace.check("child root identity preserved", child.view === screen)
    geometry(wrapper, screen)
    if CommandLine.arguments.contains("contract") {
      wrapper.dismiss(animated: false) { Trace.events.append("contractDismiss.complete") }
      _ = await wait("contract dismissal completed", until: { Trace.count("contractDismiss.complete") == 1 })
      return
    }

    let stableRoot = wrapper.view!
    let terminals = Trace.count("stack.terminal")
    let cover = UIViewController()
    cover.modalPresentationStyle = .fullScreen
    child.present(cover, animated: false) { Trace.events.append("cover.complete") }
    guard await wait("cover presentation completed", until: { Trace.count("cover.complete") == 1 }) else { return }
    Trace.check("real full screen cover presented", cover.presentingViewController != nil && cover.view.window != nil)
    Trace.check("cover retains child and root", child.parent === wrapper && wrapper.view === stableRoot)
    Trace.check("cover is not terminal dismissal", Trace.count("stack.terminal") == terminals)
    cover.dismiss(animated: false) { Trace.events.append("uncover.complete") }
    guard await wait("uncover completed", until: { Trace.count("uncover.complete") == 1 && Trace.count("primary.appear") == 2 }) else { return }
    Trace.check("uncover keeps containment", child.parent === wrapper && wrapper.view === stableRoot && wrapper.view.window != nil)
    Trace.check("cover and uncover emit no dismissal", Trace.count("primary.willDismiss") == 0)

    wrapper.hide()
    await pause(0.2)
    Trace.check("hide retains containment", wrapper.hiding && child.parent === wrapper && wrapper.view === stableRoot)
    wrapper.restorePresentation()
    await pause(0.2)
    Trace.check("restore retains containment", !wrapper.hiding && child.parent === wrapper && wrapper.view === stableRoot)
    wrapper.dismissPanModal(animated: true) { Trace.events.append("cancelledDismiss.complete") }
    await pause(0.025)
    Trace.check("dismissal started", wrapper.dismissing)
    wrapper.restorePresentation()
    guard await wait("cancellation completed", until: { Trace.count("cancelledDismiss.complete") == 1 }) else { return }
    Trace.check("cancelled dismissal keeps same parent", !wrapper.dismissing && child.parent === wrapper && root.presentedViewController === wrapper)
    Trace.check("hide and cancellation are nonterminal", Trace.count("stack.terminal") == terminals)

    weak var oldWrapper = wrapper
    var detachedAtTerminal = false
    stack.terminal = { notifiedScreen in
      detachedAtTerminal = child.parent == nil && notifiedScreen.superview == nil
      // The stack boundary may initiate another presentation synchronously.
      self.root.presentModally(child, animated: false, completion: { Trace.events.append("reopen.complete") }, slackStack: true)
    }
    let terminalEventsStart = Trace.events.count
    wrapper.dismissPanModal(animated: false) { Trace.events.append("terminalDismiss.complete") }
    guard await wait("terminal dismissal and reentrant presentation completed", until: { Trace.count("terminalDismiss.complete") == 1 && Trace.count("reopen.complete") == 1 }) else { return }
    Trace.check("child detached before stack callback", detachedAtTerminal)
    Trace.check("terminal notification delivered once", Trace.count("stack.terminal") == terminals + 1)
    let terminalOrder = ["primary.willDismiss", "stack.terminal", "terminalDismiss.complete"]
    let terminalCallbacks = Trace.events.dropFirst(terminalEventsStart).filter { terminalOrder.contains($0) }
    Trace.check("terminal callbacks preserve order", terminalCallbacks == terminalOrder)
    if let reopened = root.presentedViewController as? PanModalViewController, reopened !== wrapper {
      Trace.check("same screen reopened inside terminal callback", child.parent === reopened && reopened.children.contains(child))
      wrapper = reopened
    } else {
      Trace.check("same screen reopened inside terminal callback", false)
    }
    _ = await wait("old wrapper released after reuse", until: { oldWrapper == nil })
    stack.terminal = nil
    child.dismiss(animated: false) { Trace.events.append("childDismiss.complete") }
    guard await wait("child dismissal completed", until: { Trace.count("childDismiss.complete") == 1 }) else { return }
    Trace.check("native child dismissal routes to wrapper", root.presentedViewController == nil && child.parent == nil)
    screen.invalidate()
    await invalidation()
    await nativeSheet()
  }

  func geometry(_ wrapper: PanModalViewController, _ screen: RNCMScreenView) {
    let nativeFrame = screen.frame
    screen.reactSetFrame(CGRect(x: 37, y: 43, width: 19, height: 23))
    Trace.check("React frame cannot resize native child", screen.frame == nativeFrame)
    screen.frame = nativeFrame
    let count = bridge.uiManager.publishedSizes.count
    for _ in 0..<8 {
      wrapper.view.frame.origin.y += 1
      wrapper.view.setNeedsLayout()
      wrapper.view.layoutIfNeeded()
    }
    Trace.check("position-only layouts publish no Yoga sizes", bridge.uiManager.publishedSizes.count == count)
    let bounds = wrapper.view.bounds
    let resized = CGSize(width: bounds.width - 20, height: bounds.height - 30)
    wrapper.view.bounds.size = resized
    wrapper.view.setNeedsLayout()
    wrapper.view.layoutIfNeeded()
    Trace.check("native root resizes child", screen.frame == wrapper.view.bounds)
    Trace.check("size change publishes once", bridge.uiManager.publishedSizes.count == count + 1,
                "sizes: \(bridge.uiManager.publishedSizes!)")
    Trace.check("Yoga publication matches child bounds", bridge.uiManager.publishedSizes.last?.cgSizeValue == screen.bounds.size)
    wrapper.view.layoutIfNeeded()
    Trace.check("stable layout does not republish size", bridge.uiManager.publishedSizes.count == count + 1)
    wrapper.view.bounds = bounds
    wrapper.view.setNeedsLayout()
    wrapper.view.layoutIfNeeded()
  }

  func nativeSheet() async {
    let screen = makeScreen("native")
    let child = screen.controller!
    let terminals = Trace.count("stack.terminal")
    root.presentModally(child, animated: false, completion: { Trace.events.append("nativePresent.complete") }, slackStack: false)
    guard await wait("native page sheet presentation completed", until: { Trace.count("nativePresent.complete") == 1 && Trace.count("native.appear") == 1 }) else { return }
    guard let wrapper = root.presentedViewController as? PanModalViewController else {
      Trace.check("native page sheet presented", false)
      return
    }
    Trace.check("native page sheet uses real containment", wrapper.modalPresentationStyle == .pageSheet && child.parent === wrapper && wrapper.viewIfLoaded === wrapper.view)
    Trace.check("native page sheet sizes child", screen.frame == wrapper.view.bounds)
    child.dismiss(animated: false) { Trace.events.append("nativeDismiss.complete") }
    guard await wait("native page sheet dismissal completed", until: { Trace.count("nativeDismiss.complete") == 1 }) else { return }
    Trace.check("native page sheet dismissal detaches child", child.parent == nil && screen.superview == nil && root.presentedViewController == nil)
    Trace.check("native page sheet dismissal callbacks occur once", Trace.count("native.willDismiss") == 1 && Trace.count("stack.terminal") == terminals + 1)
    screen.invalidate()
  }

  func invalidation() async {
    var screen: RNCMScreenView? = makeScreen("invalidated")
    weak var weakScreen = screen
    weak var weakChild = screen?.controller
    root.presentModally(screen!.controller!, animated: false, completion: { Trace.events.append("invalidatedPresent.complete") }, slackStack: true)
    guard await wait("invalidation scenario presented", until: { Trace.count("invalidatedPresent.complete") == 1 && Trace.count("invalidated.appear") == 1 }) else { return }
    var wrapper = root.presentedViewController as? PanModalViewController
    weak var weakWrapper = wrapper
    screen?.invalidate()
    screen = nil
    Trace.check("invalidation retains live child through native parent", weakChild != nil && weakChild?.parent === wrapper && weakScreen != nil)
    wrapper?.dismissPanModal(animated: false) { Trace.events.append("invalidatedDismiss.complete") }
    guard await wait("invalidated dismissal completed", until: { Trace.count("invalidatedDismiss.complete") == 1 }) else { return }
    wrapper = nil
    _ = await wait("terminal dismissal releases invalidated graph", until: { weakWrapper == nil && weakChild == nil && weakScreen == nil })
    Trace.check("invalidated dismissal completes once", Trace.count("invalidatedDismiss.complete") == 1)
  }
}

UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(App.self))
