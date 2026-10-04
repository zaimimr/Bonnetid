import ExpoModulesCore
import WatchConnectivity

public final class PrayerWatchSync: ExpoAppDelegateSubscriber, WCSessionDelegate {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if WCSession.isSupported() {
      WCSession.default.delegate = self
      WCSession.default.activate()
    }
    return true
  }

  nonisolated static func push() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard
      session.activationState == .activated,
      session.isPaired,
      session.isWatchAppInstalled,
      let payload = payload()
    else { return }
    try? session.updateApplicationContext(payload)
  }

  private nonisolated static func payload() -> [String: Any]? {
    guard
      let json = UserDefaults(suiteName: appGroupIdentifier)?.string(forKey: snapshotKey),
      let data = json.data(using: .utf8),
      var snapshot = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return nil }
    snapshot["mosques"] = nil
    snapshot["origin"] = nil
    guard
      let trimmed = try? JSONSerialization.data(withJSONObject: snapshot),
      let packed = try? (trimmed as NSData).compressed(using: .lzfse)
    else { return nil }
    return ["snapshot": packed as Data]
  }

  public nonisolated func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    Self.push()
  }

  public nonisolated func sessionWatchStateDidChange(_ session: WCSession) {
    Self.push()
  }

  public nonisolated func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    replyHandler(Self.payload() ?? [:])
  }

  public nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}

  public nonisolated func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
}
