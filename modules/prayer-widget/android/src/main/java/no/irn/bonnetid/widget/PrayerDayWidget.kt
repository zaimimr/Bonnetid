package no.irn.bonnetid.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.SizeF
import android.widget.RemoteViews

/** "Dagens bønnetider": the whole day on the card, with a plate on the prayer in progress. */
class PrayerDayWidget : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
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
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH_DAY"

    private val breakpoints = listOf(
      SizeF(245f, 56f) to WidgetSize.COMPACT,
      SizeF(245f, 115f) to WidgetSize.MEDIUM,
      SizeF(245f, 200f) to WidgetSize.TALL,
    )

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerDayWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val moment = snapshot?.let { PrayerMoment.resolve(it, now) }

      for (id in ids) {
        val launch = WidgetChrome.openApp(context, 4)
        val views = if (snapshot == null || moment == null) {
          RemoteViews(context.packageName, R.layout.prayer_widget_empty)
            .also { it.setOnClickPendingIntent(R.id.root, launch) }
        } else {
          WidgetChrome.responsive(manager, id, breakpoints) { size ->
            DayViews.build(context, size, snapshot, moment, now)
              .also { it.setOnClickPendingIntent(R.id.root, launch) }
          }
        }
        manager.updateAppWidget(id, views)
      }
    }

    private fun refreshIntent(context: Context) =
      WidgetChrome.refresh(context, PrayerDayWidget::class.java, ACTION_REFRESH, 5)

    private fun scheduleNextUpdate(context: Context) {
      val now = System.currentTimeMillis()
      WidgetChrome.schedule(context, refreshIntent(context), WidgetChrome.nextBoundary(context, now))
    }
  }
}
