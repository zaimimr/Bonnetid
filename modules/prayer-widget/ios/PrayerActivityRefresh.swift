import ActivityKit
import BackgroundTasks
import ExpoModulesCore

let prayerActivityRefreshIdentifier = "no.irn.bonnetid.activity-refresh"

public final class PrayerActivityRefresh: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: prayerActivityRefreshIdentifier, using: nil) { task in
      Self.handle(task)
    }
    return true
  }

  public func applicationDidEnterBackground(_ application: UIApplication) {
    Self.schedule()
  }

  static func schedule() {
    guard #available(iOS 16.2, *) else { return }
    let ends = Activity<PrayerActivityAttributes>.activities
      .filter { $0.activityState == .active }
      .map { $0.content.state.windowEnd }
    guard let earliest = ends.min() else {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: prayerActivityRefreshIdentifier)
      return
    }
    let request = BGAppRefreshTaskRequest(identifier: prayerActivityRefreshIdentifier)
    request.earliestBeginDate = max(earliest, Date())
    try? BGTaskScheduler.shared.submit(request)
  }

  private static func handle(_ task: BGTask) {
    guard #available(iOS 16.2, *) else {
      task.setTaskCompleted(success: true)
      return
    }
    let work = Task {
      await retireFinishedActivities()
      schedule()
      task.setTaskCompleted(success: true)
    }
    task.expirationHandler = { work.cancel() }
  }

  @available(iOS 16.2, *)
  static func retireFinishedActivities() async {
    let now = Date()
    for activity in Activity<PrayerActivityAttributes>.activities where activity.activityState == .active {
      let state = activity.content.state
      guard now >= state.windowEnd else { continue }
      if let successor = state.successor(at: now) {
        await activity.update(ActivityContent(state: successor, staleDate: successor.windowEnd, relevanceScore: 100))
      } else {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}

private extension PrayerActivityAttributes.ContentState {
  func successor(at now: Date) -> Self? {
    guard
      let nextIsoDate,
      let nextLabel,
      let nextKind,
      !nextKind.isEmpty,
      let nextAt,
      let nextWindowEnd,
      now >= nextAt,
      now < nextWindowEnd
    else { return nil }
    return Self(
      isoDate: nextIsoDate,
      prayerLabel: nextLabel,
      prayerKind: nextKind,
      prayerAt: nextAt,
      windowEnd: nextWindowEnd,
      showMarkButtons: showMarkButtons
    )
  }
}
