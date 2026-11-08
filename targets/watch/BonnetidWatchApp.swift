import SwiftUI
import WatchConnectivity

@main
struct BonnetidWatchApp: App {
  @StateObject private var store = WatchStore.shared
  @StateObject private var tasbih = TasbihModel()
  @State private var page: WatchPage = .next
  @Environment(\.scenePhase) private var scenePhase

  init() {
    WatchStore.shared.activate()
  }

  var body: some Scene {
    WindowGroup {
      PrayerListView(snapshot: store.snapshot, page: $page)
        .environmentObject(tasbih)
        .onOpenURL { url in
          if url.host == "tasbih" { page = .tasbih }
        }
        .onChange(of: scenePhase) { _, phase in
          if phase == .active {
            store.request()
          } else {
            tasbih.reloadComplication()
          }
        }
    }
    .backgroundTask(.watchConnectivity) {
      while WCSession.default.hasContentPending {
        try? await Task.sleep(for: .seconds(1))
      }
    }
  }
}
