package com.hania360.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import com.google.androidbrowserhelper.trusted.LauncherActivity;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

/**
 * The Hania360 home-screen widget: the time, the Hebrew date, the coming Shabbat by the chosen town, the next
 * holiday, the weather, the dollar and a breaking headline, from https://hania360.com/api/widget. It refreshes
 * every half hour, and when ↻ is tapped. Without a connection it shows the last data it had.
 */
public class Widget extends AppWidgetProvider {
  static final String REFRESH = "com.hania360.app.REFRESH";

  static SharedPreferences prefs(Context c) { return c.getSharedPreferences("widget", Context.MODE_PRIVATE); }

  @Override public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) { run(ctx, ids, goAsync()); }

  @Override public void onReceive(Context ctx, Intent i) {
    if (REFRESH.equals(i.getAction())) {
      AppWidgetManager m = AppWidgetManager.getInstance(ctx);
      int[] ids = m.getAppWidgetIds(new ComponentName(ctx, Widget.class));
      for (int id : ids) { RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget); v.setTextViewText(R.id.at, "מעדכן…"); m.partiallyUpdateAppWidget(id, v); }
      run(ctx, ids, goAsync());
      return;
    }
    super.onReceive(ctx, i);
  }

  @Override public void onDeleted(Context ctx, int[] ids) { SharedPreferences.Editor e = prefs(ctx).edit(); for (int id : ids) e.remove("c" + id); e.apply(); }

  static void run(Context ctx, int[] ids, PendingResult pr) {
    final Context app = ctx.getApplicationContext();
    new Thread(() -> {
      try { AppWidgetManager m = AppWidgetManager.getInstance(app); for (int id : ids) update(app, m, id); }
      finally { if (pr != null) pr.finish(); }
    }).start();
  }

  static String get(String u) throws Exception {
    HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
    c.setConnectTimeout(8000); c.setReadTimeout(8000); c.setRequestProperty("user-agent", "Hania360-Android-Widget");
    try (InputStream in = c.getInputStream()) {
      ByteArrayOutputStream b = new ByteArrayOutputStream(); byte[] buf = new byte[4096]; int n;
      while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
      return b.toString("UTF-8");
    } finally { c.disconnect(); }
  }

  static PendingIntent open(Context ctx, String url, int code) {
    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url), ctx, LauncherActivity.class);
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  static void update(Context ctx, AppWidgetManager m, int id) {
    SharedPreferences p = prefs(ctx);
    int city = p.getInt("c" + id, 0);
    String js = null; boolean live = true;
    String tok = p.getString("tok", "");
    try { js = get("https://hania360.com/api/widget?c=" + city + (tok.isEmpty() ? "" : "&t=" + tok)); p.edit().putString("j" + city, js).apply(); }
    catch (Exception e) { js = p.getString("j" + city, null); live = false; }

    RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget);
    v.setOnClickPendingIntent(R.id.root, open(ctx, "https://hania360.com/?src=widget", 1));
    v.setOnClickPendingIntent(R.id.open, open(ctx, "https://hania360.com/?src=widget", 1));
    v.setOnClickPendingIntent(R.id.today, open(ctx, "https://today.hania360.com/", 2));
    v.setOnClickPendingIntent(R.id.shab, open(ctx, "https://yahadut.hania360.com/", 3));
    v.setOnClickPendingIntent(R.id.chag, open(ctx, "https://chag.hania360.com/", 4));
    Intent r = new Intent(ctx, Widget.class).setAction(REFRESH);
    v.setOnClickPendingIntent(R.id.refresh, PendingIntent.getBroadcast(ctx, 9, r, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

    if (js == null) {
      v.setTextViewText(R.id.sub, "אין חיבור לאינטרנט. לוחצים ↻ כדי לנסות שוב");
    } else try {
      JSONObject o = new JSONObject(js);
      v.setTextViewText(R.id.day, o.optString("day") + " · " + o.optString("heb"));
      v.setTextViewText(R.id.sub, o.optString("greg") + " · " + o.optString("city"));
      JSONObject s = o.optJSONObject("shab");
      if (s != null) v.setTextViewText(R.id.shab, s.optInt("now") == 1 ? "🕯️ שבת שלום · צאת השבת " + s.optString("out")
          : ("היום".equals(s.optString("day")) ? "🕯️ שבת היום: הדלקה " : "🕯️ זמני שבת: הדלקה ") + s.optString("in") + " · צאת " + s.optString("out"));
      JSONObject h = o.optJSONObject("chag");
      if (h != null) { int d = h.optInt("days"); v.setTextViewText(R.id.chag, d == 0 ? "🎉 היום " + h.optString("n") + "!" : "🗓️ " + h.optString("n") + (d == 1 ? " מחר" : " בעוד " + d + " ימים")); }
      StringBuilder w = new StringBuilder();
      JSONObject x = o.optJSONObject("wx");
      if (x != null) w.append(x.optString("d")).append(" ").append(x.optInt("t")).append("° (").append(x.optInt("lo")).append("°–").append(x.optInt("hi")).append("°)");
      if (!o.isNull("usd")) w.append(w.length() > 0 ? "   " : "").append("💵 ").append(String.format(Locale.US, "%.3f", o.optDouble("usd"))).append(" ₪");
      v.setTextViewText(R.id.wx, w.toString());
      // Today: the person's own lines (tasks, agenda, vouchers, birthdays), or an invitation to connect
      JSONObject me = o.optJSONObject("me"); int mine = 0;
      if (me != null && me.optInt("relink") == 1) {
        v.setViewVisibility(R.id.me, android.view.View.VISIBLE); v.setTextViewText(R.id.me, "🔗 צריך לחבר מחדש את Today · לחצו כאן");
        v.setOnClickPendingIntent(R.id.me, open(ctx, "https://hania360.com/widget/connect", 5));
      } else if (me != null) {
        JSONArray L = me.optJSONArray("lines"); StringBuilder sb = new StringBuilder();
        if (L != null) for (int i = 0; i < L.length(); i++) { if (sb.length() > 0) sb.append("\n"); sb.append(L.optString(i)); }
        mine = L == null ? 0 : L.length();
        v.setViewVisibility(R.id.me, android.view.View.VISIBLE); v.setTextViewText(R.id.me, mine > 0 ? sb.toString() : "📋 היום אין משימות פתוחות ✓");
        v.setOnClickPendingIntent(R.id.me, open(ctx, "https://today.hania360.com/", 6));
      } else if (tok.isEmpty() && !p.getBoolean("noAsk", false)) {
        v.setViewVisibility(R.id.me, android.view.View.VISIBLE); v.setTextViewText(R.id.me, "🔗 לחבר את Today: משימות, שוברים וימי הולדת");
        v.setOnClickPendingIntent(R.id.me, open(ctx, "https://hania360.com/widget/connect", 5));
      } else v.setViewVisibility(R.id.me, android.view.View.GONE);
      JSONArray n = o.optJSONArray("news");
      v.setTextViewText(R.id.news, n != null && n.length() > 0 && mine < 3 ? "📰 " + n.optString(0) : "");
      v.setTextViewText(R.id.at, (live ? "עודכן " : "לא מחובר · ") + o.optString("at"));
    } catch (Exception e) { v.setTextViewText(R.id.sub, "לא הצלחנו לקרוא את הנתונים"); }
    m.updateAppWidget(id, v);
  }
}
