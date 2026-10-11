package no.irn.bonnetid.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.text.format.DateFormat
import android.view.View
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class PrayerHijriWidget : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    render(context, appWidgetManager, appWidgetIds)
    scheduleNextUpdate(context)
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
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH_HIJRI"

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerHijriWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val strings = WidgetStrings.of(snapshot)
      val text = snapshot?.hijriText(now).orEmpty()
      val tokens = text.split(" ").filter { it.isNotBlank() }
      val locale = Locale.forLanguageTag(snapshot?.lang ?: "nb")
      val pattern = DateFormat.getBestDateTimePattern(locale, "EEEdMMM")

      for (id in ids) {
        val views = RemoteViews(context.packageName, R.layout.prayer_hijri)
        views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
        views.setTextViewText(R.id.gregorian, SimpleDateFormat(pattern, locale).format(Date(now)))
        if (tokens.size >= 3) {
          views.setTextViewText(R.id.hijri_day, tokens.first().trim('.'))
          views.setTextViewText(R.id.hijri_month, tokens.subList(1, tokens.size - 1).joinToString(" "))
          views.setTextViewText(R.id.hijri_year, tokens.last())
          views.setViewVisibility(R.id.hijri_year, View.VISIBLE)
        } else {
          views.setTextViewText(R.id.hijri_day, "–")
          views.setTextViewText(R.id.hijri_month, text)
          views.setViewVisibility(R.id.hijri_year, View.GONE)
        }
        views.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 6))
        manager.updateAppWidget(id, views)
      }
    }

    private fun refreshIntent(context: Context) =
      WidgetChrome.refresh(context, PrayerHijriWidget::class.java, ACTION_REFRESH, 7)

    private fun scheduleNextUpdate(context: Context) {
      val now = System.currentTimeMillis()
      WidgetChrome.schedule(context, refreshIntent(context), PrayerSnapshot.startOfNextDay(now))
    }
  }
}
