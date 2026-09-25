import ActivityKit
import BackgroundTasks
import ExpoModulesCore
import UserNotifications

let prayerRefreshIdentifier = "no.irn.bonnetid.refresh"
let notificationQueueKey = "prayer_notification_queue_v1"

private let topUpInterval: TimeInterval = 12 * 60 * 60
private let maxOwnedPending = 50
private let maxPending = 64
private let ownedPrefixes = ["prayer|", "reminder|"]

struct QueuedNotification: Codable {
  let identifier: String
  let title: String
  let body: String
  let at: Double
  let sound: String?
  let category: String?
  let isoDate: String
  let prayer: String
}

public final class PrayerBackgroundRefresh: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: prayerRefreshIdentifier, using: nil) { task in
      Self.handle(task)
    }
    return true
  }

  public func applicationDidEnterBackground(_ application: UIApplication) {
    Self.schedule()
  }

  static func schedule() {
    let now = Date()
    var candidates: [Date] = []
    if queuedNotifications().contains(where: { $0.at > now.timeIntervalSince1970 }) {
      candidates.append(now.addingTimeInterval(topUpInterval))
    }
    if #available(iOS 16.2, *) {
      candidates += Activity<PrayerActivityAttributes>.activities
        .filter { $0.activityState == .active }
        .map { $0.content.state.windowEnd }
    }
    guard let earliest = candidates.min() else {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: prayerRefreshIdentifier)
      return
    }
    let request = BGAppRefreshTaskRequest(identifier: prayerRefreshIdentifier)
    request.earliestBeginDate = max(earliest, now)
    try? BGTaskScheduler.shared.submit(request)
  }

  static func setQueue(_ json: String) {
    UserDefaults.standard.set(json, forKey: notificationQueueKey)
    schedule()
  }

  private static func handle(_ task: BGTask) {
    let work = Task {
      if #available(iOS 16.2, *) {
        await retireFinishedActivities()
      }
      await topUpNotifications()
      schedule()
      task.setTaskCompleted(success: true)
    }
    task.expirationHandler = { work.cancel() }
  }

  private static func queuedNotifications() -> [QueuedNotification] {
    guard
      let json = UserDefaults.standard.string(forKey: notificationQueueKey),
      let data = json.data(using: .utf8),
      let queue = try? JSONDecoder().decode([QueuedNotification].self, from: data)
    else { return [] }
    return queue
  }

  static func topUpNotifications() async {
    let center = UNUserNotificationCenter.current()
    let settings = await center.notificationSettings()
    guard [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) else { return }

    let pending = await center.pendingNotificationRequests()
    let pendingIds = Set(pending.map(\.identifier))
    let owned = pending.filter { request in ownedPrefixes.contains { request.identifier.hasPrefix($0) } }
    var room = min(maxOwnedPending - owned.count, maxPending - pending.count)

    let now = Date().timeIntervalSince1970
    let due = queuedNotifications()
      .filter { $0.at > now && !pendingIds.contains($0.identifier) }
      .sorted { $0.at < $1.at }

    for item in due where room > 0 {
      if Task.isCancelled { return }
      let request = UNNotificationRequest(
        identifier: item.identifier,
        content: item.content(),
        trigger: UNTimeIntervalNotificationTrigger(timeInterval: item.at - now, repeats: false)
      )
      do {
        try await center.add(request)
        room -= 1
      } catch {
        return
      }
    }
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

private extension QueuedNotification {
  func content() -> UNMutableNotificationContent {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = sound.map { UNNotificationSound(named: UNNotificationSoundName(rawValue: $0)) } ?? .default
    content.interruptionLevel = .timeSensitive
    if let category {
      content.categoryIdentifier = category
    }
    content.userInfo = ["isoDate": isoDate, "prayer": prayer]
    return content
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
