import ActivityKit
import ExpoModulesCore
import WidgetKit

private let appGroupIdentifier = "group.no.irn.bonnetid"
private let snapshotKey = "prayer_snapshot_v1"
private let logKey = "prayer_log_v1"

struct PrayerActivityState: Record {
  @Field var locationName: String = ""
  @Field var isoDate: String = ""
  @Field var prayerLabel: String = ""
  @Field var prayerKind: String = ""
  /// Epoch seconds, so no date coercion happens across the bridge.
  @Field var prayerAt: Double = 0
  @Field var windowEnd: Double = 0
}

@available(iOS 16.2, *)
private enum ActivityStore {
  static var current: Activity<PrayerActivityAttributes>?
}

public class PrayerWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PrayerWidget")

    Function("setSnapshot") { (json: String) in
      guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
        throw AppGroupUnavailableException()
      }
      defaults.set(json, forKey: snapshotKey)
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("getPrayerLog") { () -> String? in
      UserDefaults(suiteName: appGroupIdentifier)?.string(forKey: logKey)
    }

    Function("setPrayerLog") { (json: String) in
      guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
        throw AppGroupUnavailableException()
      }
      defaults.set(json, forKey: logKey)
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("areLiveActivitiesEnabled") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("startOrUpdateActivity") { (state: PrayerActivityState) in
      guard #available(iOS 16.2, *) else {
        throw LiveActivityUnsupportedException()
      }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        throw LiveActivityDisabledException()
      }

      // The window end doubles as the stale date, so the view flips its copy to "tiden er over"
      // on its own. Nothing dismisses the activity but the buttons on it.
      let content = ActivityContent(
        state: state.toContentState(),
        staleDate: Date(timeIntervalSince1970: state.windowEnd),
        relevanceScore: 100
      )

      if let running = Self.runningActivity() {
        await running.update(content)
        ActivityStore.current = running
        return
      }

      ActivityStore.current = try Activity.request(
        attributes: PrayerActivityAttributes(locationName: state.locationName),
        content: content,
        pushType: nil
      )
    }

    AsyncFunction("endActivity") {
      guard #available(iOS 16.2, *) else { return }
      for activity in Activity<PrayerActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
      ActivityStore.current = nil
    }
  }

  /// After a cold start, or after a button on the activity ended it from the app's own process,
  /// the cached handle is stale; ActivityKit is the source of truth.
  @available(iOS 16.2, *)
  private static func runningActivity() -> Activity<PrayerActivityAttributes>? {
    if let cached = ActivityStore.current, cached.activityState == .active {
      return cached
    }
    return Activity<PrayerActivityAttributes>.activities.first { $0.activityState == .active }
  }
}

private extension PrayerActivityState {
  func toContentState() -> PrayerActivityAttributes.ContentState {
    PrayerActivityAttributes.ContentState(
      isoDate: isoDate,
      prayerLabel: prayerLabel,
      prayerKind: prayerKind,
      prayerAt: Date(timeIntervalSince1970: prayerAt),
      windowEnd: Date(timeIntervalSince1970: windowEnd)
    )
  }
}

internal final class AppGroupUnavailableException: Exception {
  override var reason: String {
    "App group \(appGroupIdentifier) is not available to this build."
  }
}

internal final class LiveActivityUnsupportedException: Exception {
  override var reason: String {
    "Live Activities require iOS 16.2 or newer."
  }
}

internal final class LiveActivityDisabledException: Exception {
  override var reason: String {
    "Live Activities are turned off for this app in Settings."
  }
}
