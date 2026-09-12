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
  /// This Friday's congregation, which stands in for the Dhuhr jamat until `jummahEnd`.
  let jummahAt: Date?
  let jummahEnd: Date?

  /// What a widget prints: "Jumuah" on Friday when the mosque has one.
  var printedLabel: String { displayLabel ?? label }

  /// The single time to print when jamat times are hidden. On Friday the congregation time is
  /// the one people need, so it wins over the adhan.
  func printedAt(showJamat: Bool) -> Date {
    if !showJamat, isJummah == true, let jamat { return jamat }
    return at
  }

  /// Friday reads as Jumuah until half an hour after the last congregation, then it is an
  /// ordinary Dhuhr again. Resolved per render so a widget flips on its own, offline.
  func jummahResolved(at date: Date) -> PrayerEntry {
    guard let jummahAt else { return self }
    let isOpen = jummahEnd.map { date < $0 } ?? true
    return PrayerEntry(
      kind: kind,
      label: label,
      at: at,
      isPrayer: isPrayer,
      jamat: isOpen ? jummahAt : jamat,
      displayLabel: isOpen ? "Jumuah" : label,
      isJummah: isOpen,
      end: end,
      jummahAt: jummahAt,
      jummahEnd: jummahEnd
    )
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
    days.contains { day in day.prayers.contains { $0.jamat != nil || $0.jummahAt != nil } }
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

  /// Every prayer, with the Friday slot printed as it stands at `date`.
  func allPrayers(at date: Date) -> [PrayerEntry] {
    allPrayers.map { $0.jummahResolved(at: date) }
  }

  func hijriText(for date: Date) -> String {
    let key = PrayerSnapshot.dayKey(for: date)
    return days.first(where: { $0.date == key })?.hijriText ?? days.first?.hijriText ?? ""
  }

  /// The prayer that is currently running, using the same rule as the app: the last prayer of
  /// today that has started, until its own window end passes. Sunrise ends Fajr and midnight
  /// ends Isha, so neither lingers into the next prayer's window.
  func currentPrayer(at date: Date) -> PrayerEntry? {
    let key = PrayerSnapshot.dayKey(for: date)
    guard let day = days.first(where: { $0.date == key }) else { return nil }
    let started = day.prayers
      .filter(\.isPrayer)
      .sorted { $0.at < $1.at }
      .last { $0.at <= date }
    guard let started else { return nil }
    if let end = started.end, date >= end { return nil }
    return started.jummahResolved(at: date)
  }

  /// The five daily prayers for the calendar day containing `date`, sunrise excluded.
  /// `now` decides how the Friday slot is printed, which is not the same day when the columns
  /// have already moved on to tomorrow.
  func dailyPrayers(for date: Date, now: Date) -> [PrayerEntry] {
    let key = PrayerSnapshot.dayKey(for: date)
    let day = days.first(where: { $0.date == key }) ?? days.first
    return day?.prayers.filter(\.isPrayer).map { $0.jummahResolved(at: now) } ?? []
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
  /// The prayer whose window is open right now: Fajr stops running at sunrise, Isha at midnight.
  let current: PrayerEntry?
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
    let prayers = snapshot.allPrayers(at: date).filter(\.isPrayer)
    guard let nextIndex = prayers.firstIndex(where: { $0.at > date }) else { return nil }

    let next = prayers[nextIndex]
    let previous = nextIndex > prayers.startIndex ? prayers[nextIndex - 1] : nil

    return PrayerMoment(
      current: snapshot.currentPrayer(at: date),
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
