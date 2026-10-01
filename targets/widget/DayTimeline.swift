import Foundation

struct TimelineMark: Hashable {
  let kind: String
  let label: String
  let symbol: String
  let at: Date
  let fraction: Double
  let isPrayer: Bool
}

struct DayTimeline {
  let dayStart: Date
  let dayLength: TimeInterval
  let marks: [TimelineMark]

  static func placeable(
    _ marks: [TimelineMark],
    minGap: Double,
    highlighting: Date?
  ) -> [TimelineMark] {
    let byPriorityThenTime = marks.sorted { lhs, rhs in
      let left = rank(lhs, highlighting: highlighting)
      let right = rank(rhs, highlighting: highlighting)
      if left != right { return left < right }
      return lhs.at < rhs.at
    }

    var placed: [TimelineMark] = []
    for mark in byPriorityThenTime {
      let overlapsAlreadyPlaced = placed.contains { abs($0.fraction - mark.fraction) < minGap }
      if overlapsAlreadyPlaced { continue }
      placed.append(mark)
    }
    return placed.sorted { $0.at < $1.at }
  }

  func fraction(of date: Date) -> Double {
    guard dayLength > 0 else { return 0 }
    let value = date.timeIntervalSince(dayStart) / dayLength
    return min(max(value, 0), 1)
  }

  func mark(at date: Date) -> TimelineMark? {
    marks.first { $0.at == date }
  }

  static func build(snapshot: PrayerSnapshot, at now: Date) -> DayTimeline? {
    let calendar = snapshot.usesDeviceTimeZone ? deviceCalendar : osloCalendar
    let dayStart = calendar.startOfDay(for: now)
    guard let nextDayStart = calendar.date(byAdding: .day, value: 1, to: dayStart) else {
      return nil
    }

    let lengthOfThisDayIncludingClockChanges = nextDayStart.timeIntervalSince(dayStart)
    guard lengthOfThisDayIncludingClockChanges > 0 else { return nil }

    let key = PrayerSnapshot.dayKey(for: now)
    guard let day = snapshot.days.first(where: { $0.date == key }) else { return nil }

    var marks: [TimelineMark] = []
    for prayer in day.prayers {
      guard
        let fraction = fractionWithinDay(
          prayer.at,
          dayStart: dayStart,
          length: lengthOfThisDayIncludingClockChanges
        )
      else { continue }

      marks.append(
        TimelineMark(
          kind: prayer.kind,
          label: prayer.jummahResolved(at: now).printedLabel,
          symbol: PrayerFormat.symbol(for: prayer.kind),
          at: prayer.at,
          fraction: fraction,
          isPrayer: prayer.isPrayer
        )
      )
    }

    guard !marks.isEmpty else { return nil }

    return DayTimeline(
      dayStart: dayStart,
      dayLength: lengthOfThisDayIncludingClockChanges,
      marks: marks.sorted { $0.at < $1.at }
    )
  }

  private static func rank(_ mark: TimelineMark, highlighting: Date?) -> Int {
    if let highlighting, mark.at == highlighting { return 0 }
    return mark.isPrayer ? 1 : 2
  }

  private static func fractionWithinDay(
    _ date: Date,
    dayStart: Date,
    length: TimeInterval
  ) -> Double? {
    let value = date.timeIntervalSince(dayStart) / length
    guard value >= 0, value <= 1 else { return nil }
    return value
  }

  private static let osloCalendar: Calendar = {
    var calendar = Calendar(identifier: .gregorian)
    if let zone = TimeZone(identifier: "Europe/Oslo") { calendar.timeZone = zone }
    return calendar
  }()

  private static var deviceCalendar: Calendar {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone.current
    return calendar
  }
}
