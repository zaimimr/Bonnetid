package no.irn.bonnetid.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.SizeF
import android.widget.RemoteViews

/**
 * "Neste bønn". Emerald ground, one time, one ticking countdown. A placement wide enough to have
 * been the old two-in-one widget keeps showing the day table, so nobody loses what they placed.
 */
class PrayerAppWidget : AppWidgetProvider() {
  private enum class Variant { COMPACT, MEDIUM, TALL, WIDE }

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
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH"

    private val breakpoints = listOf(
      SizeF(110f, 56f) to Variant.COMPACT,
      SizeF(110f, 115f) to Variant.MEDIUM,
      SizeF(110f, 200f) to Variant.TALL,
      SizeF(250f, 115f) to Variant.WIDE,
    )

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerAppWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val moment = snapshot?.let { PrayerMoment.resolve(it, now) }

      for (id in ids) {
        val launch = WidgetChrome.openApp(context, 0)
        val views = if (snapshot == null || moment == null) {
          RemoteViews(context.packageName, R.layout.prayer_widget_empty)
            .also { it.setOnClickPendingIntent(R.id.root, launch) }
        } else {
          // A sized RemoteViews cannot be touched after it is combined, so every breakpoint
          // carries its own launch intent.
          WidgetChrome.responsive(manager, id, breakpoints) { variant ->
            when (variant) {
              Variant.COMPACT -> NextViews.build(context, WidgetSize.COMPACT, snapshot, moment, now)
              Variant.MEDIUM -> NextViews.build(context, WidgetSize.MEDIUM, snapshot, moment, now)
              Variant.TALL -> NextViews.build(context, WidgetSize.TALL, snapshot, moment, now)
              Variant.WIDE -> DayViews.build(context, WidgetSize.MEDIUM, snapshot, moment, now)
            }.also { it.setOnClickPendingIntent(R.id.root, launch) }
          }
        }
        manager.updateAppWidget(id, views)
      }
    }

    private fun refreshIntent(context: Context) =
      WidgetChrome.refresh(context, PrayerAppWidget::class.java, ACTION_REFRESH, 1)

    private fun scheduleNextUpdate(context: Context) {
      val now = System.currentTimeMillis()
      WidgetChrome.schedule(context, refreshIntent(context), WidgetChrome.nextBoundary(context, now))
    }
  }
}
