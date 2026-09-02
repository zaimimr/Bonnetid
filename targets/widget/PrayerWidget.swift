import SwiftUI
import WidgetKit

struct PrayerTimelineEntry: TimelineEntry {
  let date: Date
  let moment: PrayerMoment?
  let dailyPrayers: [PrayerEntry]
}

struct PrayerTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerTimelineEntry {
    PrayerTimelineEntry(date: Date(), moment: nil, dailyPrayers: [])
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerTimelineEntry) -> Void) {
    completion(entry(at: Date(), snapshot: PrayerSnapshot.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimelineEntry>) -> Void) {
    let now = Date()
    let snapshot = PrayerSnapshot.load()
    var entries: [PrayerTimelineEntry] = [entry(at: now, snapshot: snapshot)]

    // Pre-computed entries cost nothing at runtime, so the countdown stays honest without
    // spending the widget's refresh budget: every minute for the next hour, then every
    // five minutes for the rest of the day.
    for minute in stride(from: 1, through: 60, by: 1) {
      entries.append(entry(at: now.addingTimeInterval(Double(minute) * 60), snapshot: snapshot))
    }
    for minute in stride(from: 65, through: 12 * 60, by: 5) {
      entries.append(entry(at: now.addingTimeInterval(Double(minute) * 60), snapshot: snapshot))
    }

    completion(Timeline(entries: entries, policy: .atEnd))
  }

  private func entry(at date: Date, snapshot: PrayerSnapshot?) -> PrayerTimelineEntry {
    guard let snapshot else {
      return PrayerTimelineEntry(date: date, moment: nil, dailyPrayers: [])
    }
    let moment = PrayerMoment.resolve(from: snapshot, at: date)
    return PrayerTimelineEntry(
      date: date,
      moment: moment,
      // After the last prayer of the day the useful column set is tomorrow's, not today's.
      dailyPrayers: snapshot.dailyPrayers(for: moment?.headline.at ?? date)
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
          RectangularPrayerView(moment: moment, now: entry.date)
        case .accessoryCircular:
          CircularPrayerView(moment: moment, now: entry.date)
        case .accessoryInline:
          InlinePrayerView(moment: moment)
        default:
          SmallPrayerView(moment: moment, now: entry.date)
        }
      } else {
        MissingSnapshotView(family: family)
      }
    }
    .widgetURL(URL(string: "bonnetid://"))
  }
}

private struct SmallPrayerView: View {
  let moment: PrayerMoment
  let now: Date

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(moment.stateLabel)
        .font(.caption)
        .foregroundStyle(PrayerColor.inkMuted)

      HStack(spacing: 5) {
        Image(systemName: PrayerFormat.symbol(for: moment.headline.kind))
          .font(.caption)
          .foregroundStyle(PrayerColor.brand)
        Text(moment.headline.label)
          .font(.headline)
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }
      .padding(.top, 1)

      Text(PrayerFormat.time(moment.headline.at))
        .prayerTime(.system(.largeTitle, design: .default).weight(.bold))
        .foregroundStyle(PrayerColor.ink)
        .minimumScaleFactor(0.7)
        .lineLimit(1)

      Spacer(minLength: 0)

      Text(countdownLine)
        .font(.caption)
        .foregroundStyle(PrayerColor.inkSecondary)
        .lineLimit(2)
        .minimumScaleFactor(0.85)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }

  private var countdownLine: String {
    if moment.isNow {
      return "\(moment.next.label) \(PrayerFormat.countdown(to: moment.next.at, from: now))"
    }
    return PrayerFormat.countdown(to: moment.next.at, from: now)
  }
}

private struct MediumPrayerView: View {
  let entry: PrayerTimelineEntry
  let moment: PrayerMoment

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 6) {
        Text(moment.locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkSecondary)
          .lineLimit(1)
        if !moment.hijriText.isEmpty {
          Text("·")
            .font(.caption)
            .foregroundStyle(PrayerColor.inkMuted)
          Text(moment.hijriText)
            .font(.caption)
            .foregroundStyle(PrayerColor.inkMuted)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
        }
      }

      Spacer(minLength: 8)

      HStack(alignment: .center, spacing: 4) {
        ForEach(entry.dailyPrayers, id: \.at) { prayer in
          PrayerColumn(prayer: prayer, isNext: prayer.at == moment.headline.at)
        }
      }

      Spacer(minLength: 8)

      HStack(spacing: 5) {
        Image(systemName: PrayerFormat.symbol(for: moment.headline.kind))
          .font(.caption2)
        Text(footerLine)
          .font(.caption)
          .fontWeight(.medium)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }
      .foregroundStyle(PrayerColor.brand)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }

  private var footerLine: String {
    if moment.isNow {
      return "\(moment.headline.label) nå · \(moment.next.label) \(PrayerFormat.countdown(to: moment.next.at, from: entry.date))"
    }
    return "\(moment.next.label) \(PrayerFormat.countdown(to: moment.next.at, from: entry.date))"
  }
}

private struct PrayerColumn: View {
  let prayer: PrayerEntry
  let isNext: Bool

  var body: some View {
    VStack(spacing: 3) {
      Text(prayer.label)
        .font(.caption2)
        .foregroundStyle(isNext ? PrayerColor.onBrandPlate : PrayerColor.inkMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Text(PrayerFormat.time(prayer.at))
        .prayerTime(.system(.subheadline, design: .default).weight(isNext ? .bold : .medium))
        .foregroundStyle(isNext ? PrayerColor.onBrandPlate : PrayerColor.ink)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 6)
    .padding(.horizontal, 2)
    .background(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(isNext ? PrayerColor.brandPlate : Color.clear)
    )
  }
}

private struct RectangularPrayerView: View {
  let moment: PrayerMoment
  let now: Date

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(spacing: 4) {
        Image(systemName: PrayerFormat.symbol(for: moment.headline.kind))
          .font(.caption2)
        Text(moment.headline.label)
          .font(.headline)
          .lineLimit(1)
        Text(PrayerFormat.time(moment.headline.at))
          .prayerTime(.headline)
      }
      .widgetAccentable()

      Text(
        moment.isNow
          ? "\(moment.next.label) \(PrayerFormat.countdown(to: moment.next.at, from: now))"
          : PrayerFormat.countdown(to: moment.next.at, from: now)
      )
      .font(.caption)
      .lineLimit(1)
      .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(.clear, for: .widget)
  }
}

private struct CircularPrayerView: View {
  let moment: PrayerMoment
  let now: Date

  var body: some View {
    Gauge(value: moment.progress(at: now)) {
      Image(systemName: PrayerFormat.symbol(for: moment.headline.kind))
    } currentValueLabel: {
      Text(PrayerFormat.time(moment.headline.at))
        .prayerTime(.system(size: 13, weight: .semibold))
        .minimumScaleFactor(0.7)
    }
    .gaugeStyle(.accessoryCircular)
    .containerBackground(.clear, for: .widget)
  }
}

private struct InlinePrayerView: View {
  let moment: PrayerMoment

  var body: some View {
    Label(
      "\(moment.headline.label) \(PrayerFormat.time(moment.headline.at))",
      systemImage: PrayerFormat.symbol(for: moment.headline.kind)
    )
    .containerBackground(.clear, for: .widget)
  }
}

private struct MissingSnapshotView: View {
  let family: WidgetFamily

  var body: some View {
    switch family {
    case .accessoryInline:
      Label("Åpne Bønnetid", systemImage: "moon")
        .containerBackground(.clear, for: .widget)
    case .accessoryCircular:
      Image(systemName: "moon")
        .containerBackground(.clear, for: .widget)
    case .accessoryRectangular:
      VStack(alignment: .leading) {
        Text("Bønnetid").font(.headline).widgetAccentable()
        Text("Åpne appen for tider").font(.caption)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(.clear, for: .widget)
    default:
      VStack(alignment: .leading, spacing: 6) {
        Image(systemName: "moon.stars")
          .font(.title3)
          .foregroundStyle(PrayerColor.brand)
        Text("Åpne Bønnetid")
          .font(.headline)
          .foregroundStyle(PrayerColor.ink)
        Text("Tidene vises her så snart appen har hentet dem for stedet ditt.")
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
    StaticConfiguration(kind: "BonnetidPrayerWidget", provider: PrayerTimelineProvider()) { entry in
      PrayerWidgetView(entry: entry)
    }
    .configurationDisplayName("Bønnetider")
    .description("Neste bønn og dagens tider for stedet ditt.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryRectangular,
      .accessoryCircular,
      .accessoryInline,
    ])
  }
}
