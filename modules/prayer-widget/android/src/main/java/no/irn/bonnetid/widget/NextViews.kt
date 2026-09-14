package no.irn.bonnetid.widget

import android.content.Context
import android.view.View
import android.widget.RemoteViews

/**
 * "Neste bønn": the emerald widget. One prayer, one time, one live countdown, and a bar that
 * shows how far through the current window the day has come.
 */
object NextViews {
  private const val SKIPPED_ALPHA = 0.55f

  private val upcomingRowIds = intArrayOf(
    R.id.upcoming_row_0,
    R.id.upcoming_row_1,
    R.id.upcoming_row_2,
  )
  private val upcomingIconIds = intArrayOf(
    R.id.upcoming_icon_0,
    R.id.upcoming_icon_1,
    R.id.upcoming_icon_2,
  )
  private val upcomingLabelIds = intArrayOf(
    R.id.upcoming_label_0,
    R.id.upcoming_label_1,
    R.id.upcoming_label_2,
  )
  private val upcomingTimeIds = intArrayOf(
    R.id.upcoming_time_0,
    R.id.upcoming_time_1,
    R.id.upcoming_time_2,
  )

  fun build(
    context: Context,
    size: WidgetSize,
    snapshot: PrayerSnapshot,
    moment: PrayerMoment,
    now: Long,
  ): RemoteViews {
    val layout = when (size) {
      WidgetSize.COMPACT -> R.layout.prayer_next_compact
      WidgetSize.MEDIUM -> R.layout.prayer_next_medium
      WidgetSize.TALL -> R.layout.prayer_next_tall
    }
    val views = RemoteViews(context.packageName, layout)
    val showJamat = snapshot.showJamat && snapshot.hasJamatTimes
    val headline = moment.headline

    views.setImageViewResource(R.id.headline_icon, PrayerIcons.drawable(headline.kind))
    views.setTextViewText(
      R.id.headline_label,
      "${moment.stateLabel} · ${headline.displayLabel}",
    )
    views.setTextViewText(R.id.headline_time, PrayerFormat.time(headline.printedAt(showJamat)))

    val status = PrayerLogStore.statusFor(context, snapshot, headline)
    views.setViewVisibility(
      R.id.headline_check,
      if (status == PrayerLogStore.STATUS_PRAYED) View.VISIBLE else View.GONE,
    )
    val alpha = if (status == PrayerLogStore.STATUS_SKIPPED) SKIPPED_ALPHA else 1f
    views.setFloat(R.id.headline_row, "setAlpha", alpha)
    views.setFloat(R.id.headline_time, "setAlpha", alpha)

    // The compact row has neither the width for a prayer name beside the countdown nor the
    // height for the bar, so it carries the countdown alone.
    if (size != WidgetSize.COMPACT) {
      if (moment.isNow) {
        views.setTextViewText(R.id.countdown_label, moment.next.displayLabel)
        views.setViewVisibility(R.id.countdown_label, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.countdown_label, View.GONE)
      }
      WidgetChrome.progress(views, R.id.progress, moment, now)
    }
    WidgetChrome.countdown(views, R.id.countdown, moment.next.at, now, "om %s")

    if (size == WidgetSize.TALL) {
      fillUpcoming(views, snapshot, moment, showJamat, now)
    }
    return views
  }

  private fun fillUpcoming(
    views: RemoteViews,
    snapshot: PrayerSnapshot,
    moment: PrayerMoment,
    showJamat: Boolean,
    now: Long,
  ) {
    val after = if (moment.isNow) moment.headline.at else moment.next.at
    val upcoming = snapshot.allPrayers
      .filter { it.isPrayer && it.at > after }
      .map { it.resolveJummah(now) }
      .take(upcomingRowIds.size)

    for (index in upcomingRowIds.indices) {
      val prayer = upcoming.getOrNull(index)
      if (prayer == null) {
        views.setViewVisibility(upcomingRowIds[index], View.GONE)
        continue
      }
      views.setViewVisibility(upcomingRowIds[index], View.VISIBLE)
      views.setImageViewResource(upcomingIconIds[index], PrayerIcons.drawable(prayer.kind))
      views.setTextViewText(upcomingLabelIds[index], prayer.displayLabel)
      views.setTextViewText(
        upcomingTimeIds[index],
        PrayerFormat.time(prayer.printedAt(showJamat)),
      )
    }
  }
}
