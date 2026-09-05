import Foundation

let appGroupIdentifier = "group.no.irn.bonnetid"
let snapshotKey = "prayer_snapshot_v1"

struct PrayerEntry: Codable, Hashable {
  let kind: String
  let label: String
  let at: Date
  let isPrayer: Bool
  let jamat: Date?
  /// Optional so a snapshot written by an older build still decodes.
  let displayLabel: String?
  let isJummah: Bool?
  let end: Date?

  /// What a widget prints: "Jummah" on Friday when the mosque has one.
  var printedLabel: String { displayLabel ?? label }

  /// The single time to print when jamat times are hidden. On Friday the congregation time is
  /// the one people need, so it wins over the adhan.
  func printedAt(showJamat: Bool) -> Date {
    if !showJamat, isJummah == true, let jamat { return jamat }
    return at
  }
}

struct PrayerDaySnapshot: Codable, Hashable {
  let date: String
  let hijriText: String
  let prayers: [PrayerEntry]
}

struct PrayerSnapshot: Codable, Hashable {
  let version: Int
  let generatedAt: Date
  let locationName: String
  let mosqueName: String?
  let mode: String?
  let days: [PrayerDaySnapshot]

  var usesDeviceTimeZone: Bool { mode == "calculated" }

  /// True when at least one prayer has a jamat time, i.e. a mosque is selected.
  var hasJamatTimes: Bool {
    days.contains { day in day.prayers.contains { $0.jamat != nil } }
  }

  static let placeholder = PrayerSnapshot(
    version: 1,
    generatedAt: Date(),
    locationName: "Oslo",
    mosqueName: nil,
    mode: nil,
    days: []
  )

  static func load() -> PrayerSnapshot? {
    guard
      let defaults = UserDefaults(suiteName: appGroupIdentifier),
      let raw = defaults.string(forKey: snapshotKey),
      let data = raw.data(using: .utf8)
    else { return nil }

    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .custom { decoder in
      let raw = try decoder.singleValueContainer().decode(String.self)
      guard let date = PrayerSnapshot.parseISO(raw) else {
        throw DecodingError.dataCorruptedError(
          in: try decoder.singleValueContainer(),
          debugDescription: "Not an ISO 8601 instant: \(raw)"
        )
      }
      return date
    }
    guard let decoded = try? decoder.decode(PrayerSnapshot.self, from: data) else { return nil }
    dayKeyZone = decoded.usesDeviceTimeZone ? TimeZone.current : osloTimeZone
    return decoded
  }

  /// Accepts both `2026-09-02T01:44:00Z` and `2026-09-02T01:44:00.000Z`.
  static func parseISO(_ raw: String) -> Date? {
    let candidates: [ISO8601DateFormatter.Options] = [
      [.withInternetDateTime, .withFractionalSeconds],
      [.withInternetDateTime],
    ]
    for options in candidates {
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = options
      if let date = formatter.date(from: raw) { return date }
    }
    return nil
  }

  var allPrayers: [PrayerEntry] {
    days.flatMap(\.prayers).sorted { $0.at < $1.at }
  }

  func hijriText(for date: Date) -> String {
    let key = PrayerSnapshot.dayKey(for: date)
    return days.first(where: { $0.date == key })?.hijriText ?? days.first?.hijriText ?? ""
  }

  /// The prayer that is currently running, using the same boundaries as the app: the last
  /// prayer that has started, until the next entry begins. Sunrise counts as a boundary, so
  /// Fajr stops being current at sunrise rather than lingering until Duhr.
  func currentPrayer(at date: Date) -> PrayerEntry? {
    let entries = allPrayers
    guard let index = entries.lastIndex(where: { $0.isPrayer && $0.at <= date }) else {
      return nil
    }
    let next = entries.index(after: index)
    if entries.indices.contains(next), date >= entries[next].at {
      return nil
    }
    return entries[index]
  }

  /// The five daily prayers for the calendar day containing `date`, sunrise excluded.
  func dailyPrayers(for date: Date) -> [PrayerEntry] {
    let key = PrayerSnapshot.dayKey(for: date)
    let day = days.first(where: { $0.date == key }) ?? days.first
    return day?.prayers.filter(\.isPrayer) ?? []
  }

  private static var dayKeyZone = osloTimeZone

  private static let osloTimeZone = TimeZone(identifier: "Europe/Oslo") ?? TimeZone(identifier: "UTC")!

  static func dayKey(for date: Date) -> String {
    let formatter = dayKeyFormatter
    formatter.timeZone = dayKeyZone
    return formatter.string(from: date)
  }

  private static let dayKeyFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter
  }()
}

/// What every surface renders: which prayer is running, which is next, and the window between them.
struct PrayerMoment: Hashable {
  let current: PrayerEntry?
  /// The prayer whose window is open right now: Fajr stops running at sunrise, Isha at midnight.
  let running: PrayerEntry?
  let runningEnd: Date?
  let next: PrayerEntry
  let windowStart: Date
  let windowEnd: Date
  let locationName: String
  let hijriText: String

  var isNow: Bool { current != nil }
  var headline: PrayerEntry { current ?? next }
  var stateLabel: String { current == nil ? "Neste" : "Nå" }

  func progress(at date: Date) -> Double {
    let total = windowEnd.timeIntervalSince(windowStart)
    guard total > 0 else { return 0 }
    let elapsed = date.timeIntervalSince(windowStart)
    return min(max(elapsed / total, 0), 1)
  }

  /// `nil` when the snapshot has no prayer at or after `date`.
  static func resolve(from snapshot: PrayerSnapshot, at date: Date) -> PrayerMoment? {
    let prayers = snapshot.allPrayers.filter(\.isPrayer)
    guard let nextIndex = prayers.firstIndex(where: { $0.at > date }) else { return nil }

    let next = prayers[nextIndex]
    let previous = nextIndex > prayers.startIndex ? prayers[nextIndex - 1] : nil

    // A prayer counts as running for its first 20 minutes; after that the countdown to the
    // next one is the more useful number in a glance.
    let nowWindow: TimeInterval = 20 * 60
    let current = previous.flatMap { date.timeIntervalSince($0.at) < nowWindow ? $0 : nil }

    let openNow = snapshot.currentPrayer(at: date).flatMap { entry -> PrayerEntry? in
      if let end = entry.end, date >= end { return nil }
      return entry
    }

    return PrayerMoment(
      current: current,
      running: openNow,
      runningEnd: openNow.map { $0.end ?? next.at },
      next: next,
      windowStart: previous?.at ?? date,
      windowEnd: next.at,
      locationName: snapshot.locationName,
      hijriText: snapshot.hijriText(for: date)
    )
  }
}

enum PrayerFormat {
  static let clock: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "nb_NO")
    formatter.dateFormat = "HH:mm"
    return formatter
  }()

  static func time(_ date: Date) -> String {
    clock.string(from: date)
  }

  /// "1t 32m igjen" / "4 min igjen" - what is left of a window that is already running.
  static func remaining(to date: Date, from now: Date = Date()) -> String {
    let seconds = max(0, Int(date.timeIntervalSince(now)))
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    if hours > 0 {
      return "\(hours)t \(minutes)m igjen"
    }
    if minutes > 0 {
      return "\(minutes) min igjen"
    }
    return "under 1 min igjen"
  }

  /// "om 1t 32m" / "om 4 min" - Norwegian bokmål, no seconds, safe for a static render.
  static func countdown(to date: Date, from now: Date = Date()) -> String {
    let seconds = max(0, Int(date.timeIntervalSince(now)))
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    if hours > 0 {
      return "om \(hours)t \(minutes)m"
    }
    if minutes > 0 {
      return "om \(minutes) min"
    }
    return "om under 1 min"
  }

  /// A stale activity can outlive its target; a range whose upper bound is in the past traps.
  static func countdownRange(to end: Date, from now: Date = Date()) -> ClosedRange<Date> {
    now...max(end, now.addingTimeInterval(1))
  }

  static func progressRange(from start: Date, to end: Date) -> ClosedRange<Date> {
    start...max(end, start.addingTimeInterval(1))
  }

  static func symbol(for kind: String) -> String {
    switch kind {
    case "fajr": return "moon.stars"
    case "sunrise", "fajr_endtime": return "sunrise"
    case "duhr": return "sun.max"
    case "asr": return "cloud.sun"
    case "maghrib": return "sunset"
    case "isha": return "moon"
    default: return "clock"
    }
  }
}
