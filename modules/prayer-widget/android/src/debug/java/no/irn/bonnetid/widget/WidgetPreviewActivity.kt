package no.irn.bonnetid.widget

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.RemoteViews
import android.widget.ScrollView
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Debug-only bench for looking at the widgets without a launcher. Every board renders the real
 * RemoteViews through apply(), so an unsupported view class fails here exactly as it would on a
 * home screen.
 */
class WidgetPreviewActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    seedSnapshot()

    val snapshot = PrayerSnapshot.load(this)
    val now = System.currentTimeMillis()
    val moment = snapshot?.let { PrayerMoment.resolve(it, now) }
    val timeline = snapshot?.let { DayTimeline.build(it, now) }

    val board = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.parseColor("#6E7B74"))
      setPadding(dp(20), dp(20), dp(20), dp(20))
    }

    if (snapshot != null && moment != null) {
      board.addView(caption("Neste bønn"))
      board.addView(stage(140, 60) { NextViews.build(this, WidgetSize.COMPACT, snapshot, moment, now) })
      board.addView(stage(180, 60) { NextViews.build(this, WidgetSize.COMPACT, snapshot, moment, now) })
      board.addView(stage(150, 150) { NextViews.build(this, WidgetSize.MEDIUM, snapshot, moment, now) })
      board.addView(stage(150, 250) { NextViews.build(this, WidgetSize.TALL, snapshot, moment, now) })

      board.addView(caption("Dagens bønnetider"))
      board.addView(stage(330, 70) { DayViews.build(this, WidgetSize.COMPACT, snapshot, moment, now) })
      board.addView(stage(330, 150) { DayViews.build(this, WidgetSize.MEDIUM, snapshot, moment, now) })
      board.addView(stage(330, 250) { DayViews.build(this, WidgetSize.TALL, snapshot, moment, now) })

      if (timeline != null) {
        board.addView(caption("Tidslinje"))
        board.addView(stage(330, 80) {
          TimelineViews.build(this, WidgetSize.COMPACT, 330, snapshot, moment, timeline, now)
        })
        board.addView(stage(330, 150) {
          TimelineViews.build(this, WidgetSize.MEDIUM, 330, snapshot, moment, timeline, now)
        })
      }
    } else {
      board.addView(caption("Ingen snapshot"))
    }

    setContentView(ScrollView(this).apply { addView(board) })
  }

  private fun caption(text: String): TextView {
    return TextView(this).apply {
      this.text = text
      setTextColor(Color.WHITE)
      textSize = 13f
      setPadding(dp(2), dp(14), 0, dp(6))
    }
  }

  private fun stage(widthDp: Int, heightDp: Int, build: () -> RemoteViews): View {
    val host = FrameLayout(this).apply {
      layoutParams = LinearLayout.LayoutParams(dp(widthDp), dp(heightDp)).apply {
        bottomMargin = dp(14)
        gravity = Gravity.START
      }
    }
    val rendered = build().apply(this, host)
    host.addView(
      rendered,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )
    return host
  }

  private fun dp(value: Int): Int {
    return TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value.toFloat(),
      resources.displayMetrics,
    ).toInt()
  }

  /** A real Oslo day, so the timeline bar spreads the way it does in the wild. */
  private fun seedSnapshot() {
    val zone = TimeZone.getTimeZone("Europe/Oslo")
    val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
      timeZone = TimeZone.getTimeZone("UTC")
    }
    val dayKey = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = zone }
    val now = System.currentTimeMillis()

    fun at(hour: Int, minute: Int): Long {
      return Calendar.getInstance(zone).apply {
        timeInMillis = now
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }.timeInMillis
    }

    fun prayer(
      kind: String,
      label: String,
      start: Pair<Int, Int>,
      end: Pair<Int, Int>?,
      jamat: Pair<Int, Int>?,
      isPrayer: Boolean = true,
    ): String {
      val jamatValue = jamat?.let { "\"${iso.format(at(it.first, it.second))}\"" } ?: "null"
      val endValue = end?.let { "\"${iso.format(at(it.first, it.second))}\"" } ?: "null"
      return """{"kind":"$kind","label":"$label","displayLabel":"$label",""" +
        """"at":"${iso.format(at(start.first, start.second))}","isPrayer":$isPrayer,""" +
        """"jamat":$jamatValue,"isJummah":false,"end":$endValue,"jummahAt":null,"jummahEnd":null}"""
    }

    val prayers = listOf(
      prayer("fajr", "Fajr", 4 to 12, 6 to 3, 4 to 45),
      prayer("sunrise", "Soloppgang", 6 to 3, null, null, isPrayer = false),
      prayer("duhr", "Dhuhr", 13 to 20, 16 to 48, 13 to 45),
      prayer("asr", "Asr", 16 to 48, 20 to 12, 17 to 15),
      prayer("maghrib", "Maghrib", 20 to 12, 22 to 30, 20 to 25),
      prayer("isha", "Isha", 22 to 30, 23 to 58, 22 to 45),
    )

    val json = """{"version":2,"generatedAt":"${iso.format(now)}",""" +
      """"locationName":"Oslo","mosqueName":"Islamsk Rad","showJamat":true,""" +
      """"lockScreenEnabled":true,"mode":"mosque","days":[{"date":"${dayKey.format(now)}",""" +
      """"hijriText":"10. Rabi al-awwal","prayers":[${prayers.joinToString(",")}]}]}"""

    getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(SNAPSHOT_KEY, json)
      .apply()
  }
}
