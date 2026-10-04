package no.irn.bonnetid.widget

import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream

object WearSnapshot {
  const val ACTION_WRITTEN = "no.irn.bonnetid.SNAPSHOT_WRITTEN"
  const val PATH = "/prayer_snapshot"
  const val KEY = "snapshot"

  fun encode(json: String): ByteArray {
    val out = ByteArrayOutputStream()
    GZIPOutputStream(out).use { it.write(json.toByteArray(Charsets.UTF_8)) }
    return out.toByteArray()
  }

  fun decode(bytes: ByteArray): String {
    return GZIPInputStream(bytes.inputStream()).bufferedReader(Charsets.UTF_8).use { it.readText() }
  }
}
