import SwiftUI
import WatchConnectivity

@main
struct BonnetidWatchApp: App {
  @StateObject private var store = WatchStore.shared
  @Environment(\.scenePhase) private var scenePhase

  init() {
    WatchStore.shared.activate()
  }

  var body: some Scene {
    WindowGroup {
      PrayerListView(snapshot: store.snapshot)
        .onChange(of: scenePhase) { _, phase in
          if phase == .active { store.request() }
        }
    }
    .backgroundTask(.watchConnectivity) {
      while WCSession.default.hasContentPending {
        try? await Task.sleep(for: .seconds(1))
      }
    }
  }
}
