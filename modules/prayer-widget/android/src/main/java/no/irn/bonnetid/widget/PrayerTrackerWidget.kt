package no.irn.bonnetid.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews

class PrayerTrackerWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    render(context, appWidgetManager, appWidgetIds)
    scheduleNextUpdate(context)
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    render(context, appWidgetManager, intArrayOf(appWidgetId))
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      ACTION_TOGGLE -> toggle(context, intent)
      ACTION_REFRESH,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_DATE_CHANGED,
      Intent.ACTION_CONFIGURATION_CHANGED,
      -> updateAll(context)
    }
  }

  override fun onDisabled(context: Context) {
    WidgetChrome.alarms(context)?.cancel(refreshIntent(context))
  }

  companion object {
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH_TRACKER"
    const val ACTION_TOGGLE = "no.irn.bonnetid.widget.TOGGLE_PRAYER"
    private const val EXTRA_DATE = "date"
    private const val EXTRA_PRAYER = "prayer"
    private const val FUTURE_ALPHA = 0.45f

    private val slotIds = intArrayOf(R.id.column_0, R.id.column_1, R.id.column_2, R.id.column_3, R.id.column_4)

    private val breakpoints = listOf(
      SizeF(110f, 110f) to WidgetSize.COMPACT,
      SizeF(245f, 110f) to WidgetSize.MEDIUM,
    )

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerTrackerWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun toggle(context: Context, intent: Intent) {
      val date = intent.getStringExtra(EXTRA_DATE) ?: return
      val prayer = intent.getStringExtra(EXTRA_PRAYER) ?: return
      val prayed = PrayerLogStore.statusOf(context, date, prayer) == PrayerLogStore.STATUS_PRAYED
      PrayerLogStore.mark(context, date, prayer, if (prayed) null else PrayerLogStore.STATUS_PRAYED)
      updateAll(context)
      PrayerAppWidget.updateAll(context)
      PrayerDayWidget.updateAll(context)
      PrayerTimelineWidget.updateAll(context)
      PrayerStatusNotifier.refreshPosted(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val day = snapshot?.dayFor(now)
      val prayers = day?.prayers?.filter { it.isPrayer }?.map { it.resolveJummah(now) } ?: emptyList()

      for (id in ids) {
        val views = if (snapshot == null || day == null || prayers.isEmpty()) {
          RemoteViews(context.packageName, R.layout.prayer_widget_empty)
        } else {
          WidgetChrome.responsive(manager, id, breakpoints) { size ->
            build(context, size, WidgetStrings.of(snapshot), day.date, prayers, now)
          }
        }
        views.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 40, "tracker"))
        manager.updateAppWidget(id, views)
      }
    }

    private fun build(
      context: Context,
      size: WidgetSize,
      strings: WidgetStrings,
      date: String,
      prayers: List<PrayerEntry>,
      now: Long,
    ): RemoteViews {
      val asColumns = size != WidgetSize.COMPACT
      val log = PrayerLogStore.read(context)
      val statuses = prayers.map { PrayerLogStore.statusOf(log, date, it.kind) }
      val views = RemoteViews(
        context.packageName,
        if (asColumns) R.layout.prayer_tracker_columns else R.layout.prayer_tracker_rows,
      )
      views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
      views.setTextViewText(R.id.title, strings.today)
      views.setTextViewText(
        R.id.subtitle,
        strings.prayedCount(statuses.count { it == PrayerLogStore.STATUS_PRAYED }, prayers.size),
      )

      for (index in slotIds.indices) {
        views.removeAllViews(slotIds[index])
        val prayer = prayers.getOrNull(index)
        views.setViewVisibility(slotIds[index], if (prayer == null) View.GONE else View.VISIBLE)
        if (prayer == null) continue
        val status = statuses[index]
        val item = RemoteViews(
          context.packageName,
          if (asColumns) R.layout.prayer_tracker_column else R.layout.prayer_tracker_row,
        )
        item.setTextViewText(R.id.column_label, prayer.displayLabel)
        if (asColumns) item.setTextViewText(R.id.column_time, PrayerFormat.time(prayer.at))
        val prayed = status == PrayerLogStore.STATUS_PRAYED
        item.setInt(
          R.id.tracker_mark,
          "setBackgroundResource",
          if (prayed) R.drawable.prayer_tracker_done else R.drawable.prayer_tracker_ring,
        )
        item.setViewVisibility(R.id.tracker_check, if (prayed) View.VISIBLE else View.GONE)
        if (prayer.at > now) {
          item.setFloat(R.id.tracker_item, "setAlpha", FUTURE_ALPHA)
        } else {
          item.setOnClickPendingIntent(R.id.tracker_item, toggleIntent(context, date, prayer.kind, index))
        }
        views.addView(slotIds[index], item)
      }
      return views
    }

    private fun toggleIntent(context: Context, date: String, prayer: String, index: Int): PendingIntent {
      val intent = Intent(context, PrayerTrackerWidget::class.java)
        .setAction(ACTION_TOGGLE)
        .setData(Uri.parse("bonnetid-tracker://$date/$prayer"))
        .putExtra(EXTRA_DATE, date)
        .putExtra(EXTRA_PRAYER, prayer)
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
      return PendingIntent.getBroadcast(context, 41 + index, intent, flags)
    }

    private fun refreshIntent(context: Context) =
      WidgetChrome.refresh(context, PrayerTrackerWidget::class.java, ACTION_REFRESH, 46)

    private fun scheduleNextUpdate(context: Context) {
      val now = System.currentTimeMillis()
      WidgetChrome.schedule(context, refreshIntent(context), WidgetChrome.nextBoundary(context, now))
    }
  }
}
