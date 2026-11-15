import AppIntents
import SwiftUI
import WidgetKit

struct PrayerTimelineEntry: TimelineEntry {
  let date: Date
  let moment: PrayerMoment?
  let dailyPrayers: [PrayerEntry]
  /// Start time of the prayer that is running, so a column can be marked as the one in progress.
  let currentPrayerAt: Date?
  let showJamat: Bool
  /// False when no mosque is selected, in which case the toggle has nothing to show.
  let hasJamatTimes: Bool
  /// Log key to status, as marked from the app, a widget or the Live Activity.
  let statuses: [String: String]
  var mosqueName: String? = nil

  func jamat(for prayer: PrayerEntry) -> Date? {
    showJamat ? prayer.jamat : nil
  }
}

extension PrayerEntry {
  var logKey: String { PrayerLogStore.key(PrayerSnapshot.dayKey(for: at), kind) }

  func status(in statuses: [String: String]) -> String? { statuses[logKey] }
}

struct PrayerTimelineProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> PrayerTimelineEntry {
    PrayerTimelineEntry(
      date: Date(),
      moment: nil,
      dailyPrayers: [],
      currentPrayerAt: nil,
      showJamat: false,
      hasJamatTimes: false,
      statuses: [:]
    )
  }

  func snapshot(
    for configuration: PrayerWidgetConfiguration,
    in context: Context
  ) async -> PrayerTimelineEntry {
    Self.current(showJamat: configuration.showJamat)
  }

  func timeline(
    for configuration: PrayerWidgetConfiguration,
    in context: Context
  ) async -> Timeline<PrayerTimelineEntry> {
    Timeline(entries: Self.entries(showJamat: configuration.showJamat), policy: .atEnd)
  }

  static func current(showJamat: Bool) -> PrayerTimelineEntry {
    entry(
      at: Date(),
      snapshot: PrayerSnapshot.load(),
      showJamat: showJamat,
      statuses: PrayerLogStore.statuses()
    )
  }

  static func entries(showJamat: Bool) -> [PrayerTimelineEntry] {
    let now = Date()
    let snapshot = PrayerSnapshot.load()
    // The snapshot and the log are read once, not once per entry.
    let statuses = PrayerLogStore.statuses()

    // Pre-computed entries cost nothing at runtime, so the countdown stays honest without
    // spending the widget's refresh budget: every minute for the next hour, then every
    // five minutes for the rest of the day.
    let horizonMinutes = 12 * 60
    var dates: Set<Date> = [now]
    for minute in stride(from: 1, through: 60, by: 1) {
      dates.insert(now.addingTimeInterval(Double(minute) * 60))
    }
    for minute in stride(from: 65, through: horizonMinutes, by: 5) {
      dates.insert(now.addingTimeInterval(Double(minute) * 60))
    }

    // The Friday slot goes back to reading "Dhuhr" on its own, so the widget needs an entry
    // exactly then rather than up to five minutes late.
    if let snapshot {
      let horizonEnd = now.addingTimeInterval(Double(horizonMinutes) * 60)
      for prayer in snapshot.allPrayers {
        guard let end = prayer.jummahEnd, end > now, end <= horizonEnd else { continue }
        dates.insert(end)
      }
    }

    return dates.sorted().map {
      entry(at: $0, snapshot: snapshot, showJamat: showJamat, statuses: statuses)
    }
  }

  private static func entry(
    at date: Date,
    snapshot: PrayerSnapshot?,
    showJamat: Bool,
    statuses: [String: String]
  ) -> PrayerTimelineEntry {
    guard let snapshot else {
      return PrayerTimelineEntry(
        date: date,
        moment: nil,
        dailyPrayers: [],
        currentPrayerAt: nil,
        showJamat: false,
        hasJamatTimes: false,
        statuses: [:]
      )
    }
    let moment = PrayerMoment.resolve(from: snapshot, at: date)
    return PrayerTimelineEntry(
      date: date,
      moment: moment,
      // After the last prayer of the day the useful column set is tomorrow's, not today's.
      dailyPrayers: snapshot.dailyPrayers(for: moment?.headline.at ?? date, now: date),
      currentPrayerAt: snapshot.currentPrayer(at: date)?.at,
      showJamat: showJamat && snapshot.showJamat != false,
      hasJamatTimes: snapshot.hasJamatTimes,
      statuses: statuses,
      mosqueName: snapshot.mosqueName
    )
  }
}

struct PrayerWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: PrayerTimelineEntry

  var body: some View {
    Group {
      if let moment = entry.moment {
        switch family {
        case .systemMedium:
          MediumPrayerView(entry: entry, moment: moment)
        case .accessoryRectangular:
          RectangularPrayerView(
            moment: moment,
            now: entry.date,
            status: moment.headline.status(in: entry.statuses),
            jamat: entry.jamat(for: moment.headline)
          )
        case .accessoryCircular:
          CircularPrayerView(moment: moment, now: entry.date)
        case .accessoryInline:
          InlinePrayerView(
            moment: moment,
            now: entry.date,
            status: moment.headline.status(in: entry.statuses),
            jamat: entry.jamat(for: moment.headline)
          )
        default:
          SmallPrayerView(
            moment: moment,
            now: entry.date,
            status: moment.headline.status(in: entry.statuses),
            jamat: entry.jamat(for: moment.headline)
          )
        }
      } else {
        MissingSnapshotView(family: family)
      }
    }
    .widgetURL(URL(string: "bonnetid://"))
    .widgetLanguage(WidgetStrings.current)
  }
}

/// The small widget leads with the running prayer's name, then its time, with the wait for the next one
/// underneath. Between sunrise and Dhuhr no prayer is running, so it shows the next one instead.
private struct SmallPrayerView: View {
  let moment: PrayerMoment
  let now: Date
  let status: String?
  let jamat: Date?

  private var shown: PrayerEntry { moment.headline }

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(moment.locationName)
        .font(.caption)
        .foregroundStyle(PrayerColor.inkMuted)
        .lineLimit(1)

      Spacer(minLength: 0)

      HStack(spacing: 5) {
        Image(PrayerFormat.symbol(for: shown.kind))
          .font(.title3)
          .foregroundStyle(PrayerColor.brand)
        Text(shown.printedLabel)
          .font(.system(.title, design: .default).weight(.bold))
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        PrayerStatusMark(status: status, tint: PrayerColor.brand)
      }

      Text(PrayerFormat.time(shown.printedAt(showJamat: false)))
        .prayerTime(.system(.title3, design: .default).weight(.semibold))
        .foregroundStyle(PrayerColor.ink)
        .lineLimit(1)

      if let jamat {
        JamatLine(jamat: jamat)
      }

      Spacer(minLength: 0)

      Text(moment.countdownLine(from: now))
        .font(.caption)
        .foregroundStyle(PrayerColor.inkSecondary)
        .lineLimit(2)
        .minimumScaleFactor(0.85)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .opacity(status == "skipped" ? 0.55 : 1)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

extension PrayerMoment {
  func countdownLine(from now: Date) -> String {
    let countdown = WidgetStrings.current.countdown(to: next.at, from: now)
    if isNow {
      return "\(next.printedLabel) \(countdown)"
    }
    return countdown
  }
}

private struct MediumPrayerView: View {
  let entry: PrayerTimelineEntry
  let moment: PrayerMoment

  private var status: String? { moment.headline.status(in: entry.statuses) }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Text(moment.headline.printedLabel)
          .font(.system(.title3, design: .default).weight(.bold))
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
        Text(PrayerFormat.time(moment.headline.printedAt(showJamat: false)))
          .prayerTime(.system(.subheadline, design: .default).weight(.semibold))
          .foregroundStyle(PrayerColor.ink)
          .lineLimit(1)
        if let jamat = entry.jamat(for: moment.headline) {
          Text("· \(WidgetStrings.current.jamat) \(PrayerFormat.time(jamat))")
            .prayerTime(.system(.subheadline, design: .default).weight(.semibold))
            .foregroundStyle(PrayerColor.brand)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
        }
        PrayerStatusMark(status: status, tint: PrayerColor.brand)
        Spacer(minLength: 6)
        Text(moment.locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      .opacity(status == "skipped" ? 0.55 : 1)

      Spacer(minLength: 8)

      HStack(alignment: .center, spacing: 4) {
        ForEach(entry.dailyPrayers, id: \.at) { prayer in
          PrayerColumn(
            prayer: prayer,
            isCurrent: prayer.at == entry.currentPrayerAt,
            showJamat: entry.showJamat,
            status: prayer.status(in: entry.statuses)
          )
        }
      }

      Spacer(minLength: 8)

      Text(moment.countdownLine(from: entry.date))
        .font(.caption)
        .foregroundStyle(PrayerColor.inkSecondary)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

private struct HeroListPrayerView: View {
  let entry: PrayerTimelineEntry
  let moment: PrayerMoment

  private var status: String? { moment.headline.status(in: entry.statuses) }

  var body: some View {
    HStack(spacing: 12) {
      VStack(alignment: .leading, spacing: 2) {
        Text(moment.locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)

        Spacer(minLength: 0)

        HStack(spacing: 5) {
          Image(PrayerFormat.symbol(for: moment.headline.kind))
            .font(.title3)
            .foregroundStyle(PrayerColor.brand)
          Text(moment.headline.printedLabel)
            .font(.system(.title, design: .default).weight(.bold))
            .foregroundStyle(PrayerColor.brand)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
          PrayerStatusMark(status: status, tint: PrayerColor.brand)
        }

        Text(PrayerFormat.time(moment.headline.printedAt(showJamat: false)))
          .prayerTime(.system(.title3, design: .default).weight(.semibold))
          .foregroundStyle(PrayerColor.ink)
          .lineLimit(1)

        if let jamat = entry.jamat(for: moment.headline) {
          JamatLine(jamat: jamat)
        }

        Spacer(minLength: 0)

        Text(moment.countdownLine(from: entry.date))
          .font(.caption)
          .foregroundStyle(PrayerColor.inkSecondary)
          .lineLimit(2)
          .minimumScaleFactor(0.85)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .opacity(status == "skipped" ? 0.55 : 1)

      VStack(spacing: 1) {
        if entry.showJamat, entry.hasJamatTimes {
          PrayerListHeader()
        }
        ForEach(entry.dailyPrayers, id: \.at) { prayer in
          PrayerListRow(
            prayer: prayer,
            isCurrent: prayer.at == entry.currentPrayerAt,
            showJamatColumn: entry.showJamat && entry.hasJamatTimes,
            status: prayer.status(in: entry.statuses)
          )
        }
      }
      .frame(maxWidth: .infinity)
    }
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

private struct JamatLine: View {
  let jamat: Date

  var body: some View {
    Text("\(WidgetStrings.current.jamatTitle) \(PrayerFormat.time(jamat))")
      .prayerTime(.system(size: 13, weight: .semibold))
      .foregroundStyle(PrayerColor.brand)
      .lineLimit(1)
      .minimumScaleFactor(0.8)
  }
}

private struct PrayerListHeader: View {
  var body: some View {
    HStack(spacing: 4) {
      Spacer(minLength: 4)
      Text(WidgetStrings.current.adhan)
        .frame(width: 36, alignment: .trailing)
      Text(WidgetStrings.current.jamatTitle)
        .frame(width: 36, alignment: .trailing)
    }
    .font(.system(size: 9, weight: .semibold))
    .foregroundStyle(PrayerColor.inkMuted)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
    .padding(.horizontal, 8)
  }
}

private struct PrayerListRow: View {
  let prayer: PrayerEntry
  let isCurrent: Bool
  let showJamatColumn: Bool
  let status: String?

  var body: some View {
    HStack(spacing: 4) {
      Text(prayer.printedLabel)
        .font(.caption)
        .fontWeight(isCurrent ? .semibold : .regular)
        .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.inkSecondary)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      PrayerStatusMark(
        status: status,
        tint: isCurrent ? PrayerColor.onBrandPlate : PrayerColor.brand
      )
      Spacer(minLength: 4)
      if showJamatColumn {
        Text(PrayerFormat.time(prayer.at))
          .prayerTime(.system(.caption, design: .default).weight(.regular))
          .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.inkMuted)
          .lineLimit(1)
          .frame(width: 36, alignment: .trailing)
        Text(prayer.jamat.map { PrayerFormat.time($0) } ?? "-")
          .prayerTime(.system(.caption, design: .default).weight(.semibold))
          .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.ink)
          .lineLimit(1)
          .frame(width: 36, alignment: .trailing)
      } else {
        Text(PrayerFormat.time(prayer.at))
          .prayerTime(.system(.caption, design: .default).weight(isCurrent ? .bold : .medium))
          .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.ink)
          .lineLimit(1)
      }
    }
    .padding(.vertical, 3)
    .padding(.horizontal, 8)
    .background(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(isCurrent ? PrayerColor.brandPlate : Color.clear)
    )
    .opacity(status == "skipped" ? 0.5 : 1)
  }
}

private struct PrayerColumn: View {
  let prayer: PrayerEntry
  /// The plate marks the prayer in progress, never one that has not started yet.
  let isCurrent: Bool
  let showJamat: Bool
  let status: String?

  var body: some View {
    VStack(spacing: 3) {
      HStack(spacing: 2) {
        Text(prayer.printedLabel)
          .font(.caption2)
          .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.inkMuted)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        PrayerStatusMark(
          status: status,
          tint: isCurrent ? PrayerColor.onBrandPlate : PrayerColor.brand
        )
      }
      Text(PrayerFormat.time(prayer.printedAt(showJamat: showJamat)))
        .prayerTime(.system(.subheadline, design: .default).weight(isCurrent ? .bold : .medium))
        .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.ink)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      if showJamat, let jamat = prayer.jamat {
        Text(PrayerFormat.time(jamat))
          .prayerTime(.caption2)
          .foregroundStyle(isCurrent ? PrayerColor.onBrandPlate : PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 6)
    .padding(.horizontal, 2)
    .background(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(isCurrent ? PrayerColor.brandPlate : Color.clear)
    )
    .opacity(status == "skipped" ? 0.5 : 1)
  }
}

/// A prayed prayer gets a checkmark; a skipped one is dimmed by its container instead.
private struct PrayerStatusMark: View {
  let status: String?
  let tint: Color

  var body: some View {
    if status == "prayed" {
      Image("bt.check-circle-fill")
        .font(.caption2)
        .foregroundStyle(tint)
    }
  }
}

private struct RectangularPrayerView: View {
  let moment: PrayerMoment
  let now: Date
  let status: String?
  let jamat: Date?

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(spacing: 4) {
        Image(PrayerFormat.symbol(for: moment.headline.kind))
          .font(.caption2)
        Text(moment.headline.printedLabel)
          .font(.headline)
          .lineLimit(1)
        Text(PrayerFormat.time(moment.headline.at))
          .prayerTime(.headline)
        if status == "prayed" {
          Image("bt.check-circle-fill")
            .font(.caption2)
        }
      }
      .widgetAccentable()

      if let jamat {
        Text("\(WidgetStrings.current.jamatTitle) \(PrayerFormat.time(jamat))")
          .prayerTime(.system(.caption, design: .default).weight(.semibold))
          .lineLimit(1)
      }

      Text(
        moment.isNow
          ? "\(moment.next.printedLabel) \(WidgetStrings.current.countdown(to: moment.next.at, from: now))"
          : WidgetStrings.current.countdown(to: moment.next.at, from: now)
      )
      .font(.caption)
      .lineLimit(1)
      .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .opacity(status == "skipped" ? 0.6 : 1)
    .containerBackground(.clear, for: .widget)
  }
}

private struct CircularPrayerView: View {
  let moment: PrayerMoment
  let now: Date

  var body: some View {
    Gauge(value: moment.progress(at: now)) {
      Text(moment.headline.printedLabel)
        .font(.system(size: 10, weight: .semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    } currentValueLabel: {
      Text(
        timerInterval: PrayerFormat.countdownRange(to: moment.next.at, from: now),
        countsDown: true
      )
        .prayerTime(.system(size: 12, weight: .semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
    .gaugeStyle(.accessoryCircular)
    .containerBackground(.clear, for: .widget)
  }
}

private struct CircularNameTimeView: View {
  let moment: PrayerMoment
  let jamat: Date?

  var body: some View {
    ZStack {
      AccessoryWidgetBackground()
      VStack(spacing: 0) {
        Text(moment.headline.printedLabel)
          .font(.system(size: 12, weight: .bold))
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        Text(PrayerFormat.time(moment.headline.at))
          .prayerTime(.system(size: 12, weight: .medium))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        if let jamat {
          Text("\(WidgetStrings.current.jamatShort) \(PrayerFormat.time(jamat))")
            .prayerTime(.system(size: 10, weight: .semibold))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
        }
      }
      .padding(.horizontal, 4)
      .widgetAccentable()
    }
    .containerBackground(.clear, for: .widget)
  }
}

private struct InlinePrayerView: View {
  let moment: PrayerMoment
  let now: Date
  let status: String?
  let jamat: Date?

  private var text: String {
    let strings = WidgetStrings.current
    if moment.isNow, let jamat {
      return "\(strings.nowLine(moment.headline.printedLabel)) · \(strings.jamat) \(PrayerFormat.time(jamat))"
    }
    if moment.isNow {
      return "\(strings.nowLine(moment.headline.printedLabel)) · \(moment.next.printedLabel) \(strings.countdown(to: moment.next.at, from: now))"
    }
    return "\(moment.headline.printedLabel) \(strings.countdown(to: moment.headline.at, from: now))"
  }

  var body: some View {
    Label(
      text,
      image: status == "prayed"
        ? "bt.check-circle-fill"
        : PrayerFormat.symbol(for: moment.headline.kind)
    )
    .containerBackground(.clear, for: .widget)
  }
}

private struct MissingSnapshotView: View {
  let family: WidgetFamily
  private var strings: WidgetStrings { WidgetStrings.current }

  var body: some View {
    switch family {
    case .accessoryInline:
      Label(strings.openApp, image: "bt.moon")
        .containerBackground(.clear, for: .widget)
    case .accessoryCircular:
      Image("bt.moon")
        .containerBackground(.clear, for: .widget)
    case .accessoryRectangular:
      VStack(alignment: .leading) {
        Text(strings.appName).font(.headline).widgetAccentable()
        Text(strings.openAppForTimes).font(.caption)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(.clear, for: .widget)
    default:
      VStack(alignment: .leading, spacing: 6) {
        Image("bt.moon-stars")
          .font(.title3)
          .foregroundStyle(PrayerColor.brand)
        Text(strings.openApp)
          .font(.headline)
          .foregroundStyle(PrayerColor.ink)
        Text(strings.timesAppearHere)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkSecondary)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .containerBackground(PrayerColor.surface, for: .widget)
    }
  }
}

struct PrayerWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: "BonnetidPrayerWidget",
      intent: PrayerWidgetConfiguration.self,
      provider: PrayerTimelineProvider()
    ) { entry in
      PrayerWidgetView(entry: entry)
    }
    .configurationDisplayName(WidgetStrings.current.prayerWidgetName)
    .description(WidgetStrings.current.prayerWidgetDescription)
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryRectangular,
      .accessoryCircular,
      .accessoryInline,
    ])
  }
}

struct PrayerNowWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: PrayerTimelineEntry

  var body: some View {
    Group {
      if let moment = entry.moment {
        if family == .accessoryCircular {
          CircularNameTimeView(moment: moment, jamat: entry.jamat(for: moment.headline))
        } else {
          HeroListPrayerView(entry: entry, moment: moment)
        }
      } else {
        MissingSnapshotView(family: family)
      }
    }
    .widgetURL(URL(string: "bonnetid://"))
    .widgetLanguage(WidgetStrings.current)
  }
}

struct PrayerNowWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: "BonnetidPrayerNowWidget",
      intent: PrayerWidgetConfiguration.self,
      provider: PrayerTimelineProvider()
    ) { entry in
      PrayerNowWidgetView(entry: entry)
    }
    .configurationDisplayName(WidgetStrings.current.prayerNowWidgetName)
    .description(WidgetStrings.current.prayerNowWidgetDescription)
    .supportedFamilies([.systemMedium, .accessoryCircular])
  }
}
