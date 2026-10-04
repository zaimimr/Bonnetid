import Foundation
import WatchConnectivity
import WidgetKit

final class WatchStore: NSObject, ObservableObject, WCSessionDelegate {
  static let shared = WatchStore()

  @Published private(set) var snapshot: PrayerSnapshot? = PrayerSnapshot.load()

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func request() {
    let session = WCSession.default
    guard session.activationState == .activated, session.isReachable else { return }
    session.sendMessage(["request": "snapshot"], replyHandler: { [weak self] reply in
      self?.save(reply)
    }, errorHandler: nil)
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    guard activationState == .activated else { return }
    save(session.receivedApplicationContext)
    request()
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    save(applicationContext)
  }

  private func save(_ payload: [String: Any]) {
    guard
      let packed = payload["snapshot"] as? Data,
      let data = try? (packed as NSData).decompressed(using: .lzfse) as Data,
      let json = String(data: data, encoding: .utf8),
      let defaults = UserDefaults(suiteName: appGroupIdentifier),
      defaults.string(forKey: snapshotKey) != json
    else { return }
    defaults.set(json, forKey: snapshotKey)
    WidgetCenter.shared.reloadAllTimelines()
    let snapshot = PrayerSnapshot.load()
    DispatchQueue.main.async { self.snapshot = snapshot }
  }
}
