package no.irn.bonnetid.widget

import android.content.Context
import android.view.View
import android.widget.RemoteViews

/**
 * "Dagens bønnetider": the five prayers of the day on the app's card. The prayer in progress gets
 * a solid emerald plate, built as its own RemoteViews and added into the slot, so every colour
 * stays declared in XML and survives a light/dark switch.
 */
object DayViews {
  private const val SKIPPED_ALPHA = 0.45f

  private val slotIds = intArrayOf(
    R.id.column_0,
    R.id.column_1,
    R.id.column_2,
    R.id.column_3,
    R.id.column_4,
  )

  fun build(
    context: Context,
    size: WidgetSize,
    snapshot: PrayerSnapshot,
    moment: PrayerMoment,
    now: Long,
  ): RemoteViews {
    val layout = when (size) {
      WidgetSize.COMPACT -> R.layout.prayer_day_compact
      WidgetSize.MEDIUM -> R.layout.prayer_day_medium
      WidgetSize.TALL -> R.layout.prayer_day_tall
    }
    val views = RemoteViews(context.packageName, layout)
    val showJamat = snapshot.showJamat && snapshot.hasJamatTimes

    if (size != WidgetSize.COMPACT) {
      views.setTextViewText(R.id.location, moment.locationName)
      views.setTextViewText(R.id.hijri, moment.hijriText)
    }
    when (size) {
      WidgetSize.MEDIUM -> fillFooter(views, moment, showJamat, now)
      WidgetSize.TALL -> fillHero(views, moment, showJamat, now)
      WidgetSize.COMPACT -> Unit
    }

    fillColumns(context, views, snapshot, moment, showJamat, now)
    return views
  }

  private fun fillColumns(
    context: Context,
    views: RemoteViews,
    snapshot: PrayerSnapshot,
    moment: PrayerMoment,
    showJamat: Boolean,
    now: Long,
  ) {
    val day = snapshot.dayFor(moment.headline.at)
    val prayers = day?.prayers?.filter { it.isPrayer }?.map { it.resolveJummah(now) } ?: emptyList()
    val currentAt = snapshot.currentPrayer(now)?.at

    for (index in slotIds.indices) {
      views.removeAllViews(slotIds[index])
      val prayer = prayers.getOrNull(index)
      if (prayer == null) {
        views.setViewVisibility(slotIds[index], View.GONE)
        continue
      }
      views.setViewVisibility(slotIds[index], View.VISIBLE)
      val status = day?.let { PrayerLogStore.statusOf(context, it.date, prayer.kind) }
      views.addView(
        slotIds[index],
        column(context, prayer, prayer.at == currentAt, showJamat, status),
      )
    }
  }

  private fun column(
    context: Context,
    prayer: PrayerEntry,
    isCurrent: Boolean,
    showJamat: Boolean,
    status: String?,
  ): RemoteViews {
    val layout = if (isCurrent) {
      R.layout.prayer_day_column_current
    } else {
      R.layout.prayer_day_column
    }
    val column = RemoteViews(context.packageName, layout)
    column.setTextViewText(R.id.column_label, prayer.displayLabel)
    column.setTextViewText(R.id.column_time, PrayerFormat.time(prayer.printedAt(showJamat)))
    column.setViewVisibility(
      R.id.column_check,
      if (status == PrayerLogStore.STATUS_PRAYED) View.VISIBLE else View.GONE,
    )

    val jamat = prayer.jamat
    if (showJamat && jamat != null) {
      column.setTextViewText(R.id.column_jamat, PrayerFormat.time(jamat))
      column.setViewVisibility(R.id.column_jamat, View.VISIBLE)
    } else {
      column.setViewVisibility(R.id.column_jamat, View.GONE)
    }

    if (status == PrayerLogStore.STATUS_SKIPPED) {
      column.setFloat(R.id.column_label, "setAlpha", SKIPPED_ALPHA)
      column.setFloat(R.id.column_time, "setAlpha", SKIPPED_ALPHA)
      column.setFloat(R.id.column_jamat, "setAlpha", SKIPPED_ALPHA)
    }
    return column
  }

  private fun fillFooter(
    views: RemoteViews,
    moment: PrayerMoment,
    showJamat: Boolean,
    now: Long,
  ) {
    views.setImageViewResource(R.id.footer_icon, PrayerIcons.drawable(moment.next.kind))
    views.setTextViewText(R.id.footer_label, moment.next.displayLabel)
    WidgetChrome.countdown(views, R.id.countdown, moment.next.at, now, "om %s")
    views.setViewVisibility(
      R.id.footer_jamat,
      if (showJamat) View.VISIBLE else View.GONE,
    )
  }

  private fun fillHero(
    views: RemoteViews,
    moment: PrayerMoment,
    showJamat: Boolean,
    now: Long,
  ) {
    views.setImageViewResource(R.id.headline_icon, PrayerIcons.drawable(moment.headline.kind))
    views.setTextViewText(
      R.id.headline_label,
      "${moment.stateLabel} · ${moment.headline.displayLabel}",
    )
    views.setTextViewText(
      R.id.headline_time,
      PrayerFormat.time(moment.headline.printedAt(showJamat)),
    )
    WidgetChrome.countdown(views, R.id.countdown, moment.next.at, now, "%s")
    views.setTextViewText(
      R.id.countdown_label,
      "til ${moment.next.displayLabel} ${PrayerFormat.time(moment.next.at)}",
    )
  }
}
