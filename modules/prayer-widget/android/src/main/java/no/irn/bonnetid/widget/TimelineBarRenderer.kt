package no.irn.bonnetid.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.drawable.Drawable

/**
 * RemoteViews cannot compose the timeline out of views, so the bar is drawn once per update and
 * handed over as a bitmap. Everything above it stays real text so it still follows the system
 * font size. Mirrors TimelineBar in the iOS widget target.
 */
object TimelineBarRenderer {
  private const val GLYPH_BAND_DP = 16f
  private const val GLYPH_SIZE_DP = 12f
  private const val GLYPH_SLOT_DP = 20f
  private const val BAR_HEIGHT_DP = 9f
  private const val AXIS_BAND_DP = 13f
  private const val MARKER_OVERHANG_DP = 3f
  private const val KNOB_RING_DP = 2f

  private val axisLabels = listOf(
    0.25 to "06",
    0.5 to "12",
    0.75 to "18",
  )

  fun render(
    context: Context,
    timeline: DayTimeline,
    now: Long,
    markerAt: Long?,
    widthPx: Int,
    heightPx: Int,
  ): Bitmap? {
    if (widthPx <= 0 || heightPx <= 0) return null

    val density = context.resources.displayMetrics.density
    val glyphBand = GLYPH_BAND_DP * density
    val glyphSize = GLYPH_SIZE_DP * density
    val glyphSlot = GLYPH_SLOT_DP * density
    val barHeight = BAR_HEIGHT_DP * density
    val axisBand = AXIS_BAND_DP * density
    val markerOverhang = MARKER_OVERHANG_DP * density
    val knobRing = KNOB_RING_DP * density

    val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    val brand = color(context, R.color.prayer_widget_brand)
    val track = color(context, R.color.prayer_widget_track)
    val trackMarker = color(context, R.color.prayer_widget_track_marker)
    val inkMuted = color(context, R.color.prayer_widget_ink_muted)
    val surface = color(context, R.color.prayer_widget_surface)

    val width = widthPx.toFloat()
    val barTop = glyphBand + 2f * density
    val barBottom = barTop + barHeight
    val barCentre = barTop + barHeight / 2f
    val axisCentre = barBottom + 4f * density + axisBand / 2f
    val radius = barHeight / 2f
    val progress = timeline.fraction(now).toFloat()

    paint.color = track
    canvas.drawRoundRect(RectF(0f, barTop, width, barBottom), radius, radius, paint)

    val filled = (width * progress).coerceAtLeast(barHeight)
    paint.color = brand
    canvas.drawRoundRect(RectF(0f, barTop, filled, barBottom), radius, radius, paint)

    for (mark in timeline.marks) {
      val x = clamp(width * mark.fraction.toFloat(), width, density)
      paint.color = if (mark.fraction <= progress) surface else trackMarker
      paint.alpha = 140
      canvas.drawRect(x - density / 2f, barTop, x + density / 2f, barBottom, paint)
      paint.alpha = 255
    }

    if (markerAt != null) {
      timeline.mark(markerAt)?.let { mark ->
        val x = clamp(width * mark.fraction.toFloat(), width, 2f * density)
        paint.color = trackMarker
        canvas.drawRoundRect(
          RectF(x - density, barTop - markerOverhang, x + density, barBottom + markerOverhang),
          density,
          density,
          paint,
        )
      }
    }

    val knobRadius = barHeight / 2f + 2f * density
    val knobX = clamp(width * progress, width, knobRadius * 2f)
    paint.color = surface
    canvas.drawCircle(knobX, barCentre, knobRadius + knobRing, paint)
    paint.color = brand
    canvas.drawCircle(knobX, barCentre, knobRadius, paint)

    val glyphs = DayTimeline.placeable(
      timeline.marks,
      minGap = if (width > 0) (glyphSlot / width).toDouble() else 1.0,
      highlighting = markerAt,
    )
    for (mark in glyphs) {
      val drawable: Drawable = context.getDrawable(PrayerIcons.drawable(mark.kind))
        ?.mutate() ?: continue
      drawable.setTint(if (mark.at == markerAt) brand else inkMuted)
      val x = clamp(width * mark.fraction.toFloat(), width, glyphSlot)
      val half = glyphSize / 2f
      drawable.setBounds(
        (x - half).toInt(),
        (glyphBand / 2f - half).toInt(),
        (x + half).toInt(),
        (glyphBand / 2f + half).toInt(),
      )
      drawable.draw(canvas)
    }

    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    textPaint.color = inkMuted
    textPaint.textSize = 10f * density
    textPaint.textAlign = Paint.Align.CENTER
    for ((fraction, label) in axisLabels) {
      val x = clamp(width * fraction.toFloat(), width, 30f * density)
      canvas.drawText(label, x, axisCentre + textPaint.textSize / 3f, textPaint)
    }

    return bitmap
  }

  fun heightPx(context: Context): Int {
    val density = context.resources.displayMetrics.density
    return ((GLYPH_BAND_DP + BAR_HEIGHT_DP + AXIS_BAND_DP + 8f) * density).toInt()
  }

  private fun clamp(value: Float, width: Float, slot: Float): Float {
    val half = slot / 2f
    return value.coerceIn(half, (width - half).coerceAtLeast(half))
  }

  private fun color(context: Context, id: Int): Int = context.getColor(id)
}
