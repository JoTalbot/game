package world.igra.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.MimeTypeMap;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private WebView webView;
    private android.widget.FrameLayout root;

    @Override
    @android.annotation.SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            requestWindowFeature(Window.FEATURE_NO_TITLE);
            getWindow().setBackgroundDrawable(new ColorDrawable(0xFF05060A));
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                getWindow().setStatusBarColor(0xFF05060A);
                getWindow().setNavigationBarColor(0xFF05060A);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                getWindow().getAttributes().layoutInDisplayCutoutMode =
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            }
            hideSystemUi();

            // Oukitel G1 (Android 15): WebView, рождённый до измерения окна,
            // получает поверхность в CSS-пикселях (384×853) и потом вечно
            // рисует её призрак поверх здорового кадра. Поэтому оболочка
            // рождается поздно: сначала пустой корень, WebView — только когда
            // decorView измерен. Никаких перепинов размеров после рождения.
            root = new android.widget.FrameLayout(this);
            root.setBackgroundColor(0xFF05060A);
            setContentView(root);
            final View decor = getWindow().getDecorView();
            decor.post(new Runnable() {
                public void run() { attachWebView(); }
            });
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    private void attachWebView() {
        if (webView != null || root == null) return;
        try {
            View decor = getWindow().getDecorView();
            if (decor == null || decor.getWidth() < 8 || decor.getHeight() < 8) {
                if (decor != null) {
                    decor.postDelayed(new Runnable() {
                        public void run() { attachWebView(); }
                    }, 60);
                }
                return;
            }

            // Жест принадлежит игре, а не прокрутке.
            //
            // Человек три релиза подряд: «новые точки не обводятся
            // удержанием пальца». В JS всё было починено (touch-action,
            // preventDefault, честный touchcancel), а на телефоне жест
            // по-прежнему умирал на полпути к рождению (1.35 с). Потому
            // что рвал его не JavaScript: WebView — прокручиваемый View,
            // и её собственный распознаватель через ~300 мс решает, что
            // затянувшееся касание есть скролл. Он забирает жест у
            // страницы ДО того, как та успеет сказать preventDefault, и
            // шлёт вниз системную отмену.
            //
            // Лечится только здесь: сама вьюха запрещает родителям и
            // своему распознавателю трогать жест, пока палец на стекле.
            // В игре нечего прокручивать — берег двигает камера.
            webView = new WebView(this) {
                @Override
                public boolean onTouchEvent(MotionEvent ev) {
                    int a = ev.getActionMasked();
                    if (a == MotionEvent.ACTION_DOWN || a == MotionEvent.ACTION_MOVE) {
                        // «Не перехватывать» — просьба ко всей цепочке
                        // родителей: пока палец лежит, жест наш.
                        // MOVE тоже: иначе родитель передумывает на ходу.
                        requestDisallowInterceptTouchEvent(true);
                        if (getParent() != null) {
                            getParent().requestDisallowInterceptTouchEvent(true);
                        }
                    } else if (a == MotionEvent.ACTION_UP) {
                        if (getParent() != null) {
                            getParent().requestDisallowInterceptTouchEvent(false);
                        }
                    }
                    return super.onTouchEvent(ev);
                }

                // WebView прокручивает себя сама, если решит, что жест —
                // скролл. Прокручивать нечего: страница ровно в размер
                // окна. Глушим — иначе она уводит содержимое и рвёт
                // касание.
                @Override
                public void scrollTo(int x, int y) { super.scrollTo(0, 0); }

                @Override
                public void computeScroll() { /* инерции нет */ }

                @Override
                protected boolean overScrollBy(int dx, int dy, int sx, int sy,
                                               int rx, int ry, int mx, int my,
                                               boolean touch) {
                    return false;
                }
            };
            webView.setBackgroundColor(0xFF05060A);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            // Долгое удержание — жест игры, а не системное «выделить
            // текст»: длинный тап поднимал бы контекстное меню и убивал
            // касание ровно на той секунде, когда рождается узел.
            webView.setLongClickable(false);
            webView.setHapticFeedbackEnabled(false);
            webView.setOnLongClickListener(new View.OnLongClickListener() {
                public boolean onLongClick(View v) { return true; }
            });
            // Отчёт 2.31 №2: система забрала жест ×6, медиана 0.71 с.
            // Android 15 (Oukitel) на long-press включает рукописный ввод
            // и Chromium-выделение — оба шлют touchcancel до рождения (1.35 с).
            if (Build.VERSION.SDK_INT >= 33) {
                webView.setAutoHandwritingEnabled(false);
            }
            ActionMode.Callback killSelect = new ActionMode.Callback() {
                public boolean onCreateActionMode(ActionMode mode, Menu menu) { return false; }
                public boolean onPrepareActionMode(ActionMode mode, Menu menu) { return false; }
                public boolean onActionItemClicked(ActionMode mode, MenuItem item) { return false; }
                public void onDestroyActionMode(ActionMode mode) {}
            };
            webView.setCustomSelectionActionModeCallback(killSelect);
            if (Build.VERSION.SDK_INT >= 23) {
                webView.setCustomInsertionActionModeCallback(killSelect);
            }
            webView.setNestedScrollingEnabled(false);
            webView.setWebViewClient(new AssetClient(getAssets()));
            webView.setWebChromeClient(new WebChromeClient());

            // Сейв должен переживать перезапуск, а localStorage в WebView
            // на Android может не жить (кастомный origin https://igra.local,
            // отдаваемый через shouldInterceptRequest, — на некоторых ядрах
            // и Android 15 хранилище привязано к сессии и стирается).
            // Нативный мост в SharedPreferences переживает всё, кроме удаления
            // игры. Игра предпочитает его localStorage; тот остаётся запасным
            // для браузера. Ключ тот же: igra.save.v1.
            webView.addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public String read(String key) {
                    try {
                        return getSharedPreferences("igra", MODE_PRIVATE)
                                .getString(key, null);
                    } catch (Throwable t) {
                        return null;
                    }
                }

                @android.webkit.JavascriptInterface
                public void write(String key, String value) {
                    try {
                        getSharedPreferences("igra", MODE_PRIVATE)
                                .edit().putString(key, value).apply();
                    } catch (Throwable t) {}
                }

                @android.webkit.JavascriptInterface
                public void remove(String key) {
                    try {
                        getSharedPreferences("igra", MODE_PRIVATE)
                                .edit().remove(key).apply();
                    } catch (Throwable t) {}
                }
            }, "AndroidSave");

            WebSettings s = webView.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            s.setDatabaseEnabled(true);
            s.setMediaPlaybackRequiresUserGesture(false);
            s.setAllowFileAccess(true);
            s.setAllowContentAccess(true);
            s.setAllowFileAccessFromFileURLs(true);
            s.setAllowUniversalAccessFromFileURLs(true);
            s.setUseWideViewPort(true);
            s.setLoadWithOverviewMode(false);
            s.setSupportZoom(false);
            s.setBuiltInZoomControls(false);
            s.setDisplayZoomControls(false);
            s.setTextZoom(100);
            s.setCacheMode(WebSettings.LOAD_NO_CACHE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                s.setSafeBrowsingEnabled(false);
            }

            root.addView(webView, new android.widget.FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            webView.post(new Runnable() {
                public void run() { resizeGame(); }
            });
            webView.loadUrl("https://igra.local/www/index.html");
            webView.postDelayed(new Runnable() {
                public void run() { resizeGame(); }
            }, 900);
            // Щуп остаётся охранником: если слой всё же врёт — матрица.
            webView.postDelayed(new Runnable() {
                public void run() { probeFitIntegrity(); }
            }, 1400);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    private static class AssetClient extends WebViewClient {
        private final AssetManager assets;

        AssetClient(AssetManager assets) {
            this.assets = assets;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request == null) return null;
            Uri uri = request.getUrl();
            if (uri == null) return null;
            return handleUri(uri);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            if (url == null) return null;
            return handleUri(Uri.parse(url));
        }

        private WebResourceResponse handleUri(Uri uri) {
            String hostName = uri.getHost();
            if (hostName == null || !hostName.equals("igra.local")) return null;
            String path = uri.getPath();
            if (path == null || path.length() < 2) path = "/www/index.html";
            path = path.substring(1);
            try {
                InputStream in = assets.open(path);
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Cache-Control", "no-store");
                return new WebResourceResponse(mime(path), "utf-8", 200, "OK", headers, in);
            } catch (IOException e) {
                return new WebResourceResponse(
                        "text/plain", "utf-8", 404, "Not Found",
                        null, new ByteArrayInputStream(new byte[0]));
            }
        }
    }

    private static String mime(String path) {
        String ext = MimeTypeMap.getFileExtensionFromUrl(path);
        if (ext == null) ext = "";
        ext = ext.toLowerCase();
        if (ext.equals("html")) return "text/html";
        if (ext.equals("js")) return "application/javascript";
        if (ext.equals("css")) return "text/css";
        if (ext.equals("png")) return "image/png";
        if (ext.equals("jpg") || ext.equals("jpeg")) return "image/jpeg";
        if (ext.equals("svg")) return "image/svg+xml";
        if (ext.equals("json")) return "application/json";
        if (ext.equals("ttf")) return "font/ttf";
        if (ext.equals("woff") || ext.equals("woff2")) return "font/woff2";
        String guess = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return guess != null ? guess : "application/octet-stream";
    }

    // One honest call: ask the game to re-measure the viewport. Before that,
    // leave native metrics on the window object — the fit-debug line shows
    // them, so a screenshot from the phone carries the whole picture.
    private void resizeGame() {
        if (webView == null) return;
        try {
            android.util.DisplayMetrics real = new android.util.DisplayMetrics();
            getWindowManager().getDefaultDisplay().getRealMetrics(real);
            int vw = webView.getWidth();
            int vh = webView.getHeight();
            View decor = getWindow().getDecorView();
            int dw = decor != null ? decor.getWidth() : 0;
            int dh = decor != null ? decor.getHeight() : 0;
            int appDpi = getResources().getDisplayMetrics().densityDpi;
            int realDpi = real.densityDpi;
            // Перепись нутра: кто живёт внутри WebView и какой у неё паспорт.
            StringBuilder kids = new StringBuilder();
            int nk = webView.getChildCount();
            for (int i = 0; i < nk && i < 4; i++) {
                View c = webView.getChildAt(i);
                if (c != null) {
                    kids.append(" kid=").append(c.getClass().getSimpleName())
                            .append(' ').append(c.getWidth()).append('x').append(c.getHeight());
                }
            }
            String wv = "?";
            try {
                String ua = webView.getSettings().getUserAgentString();
                int ci = ua.indexOf("Chrome/");
                if (ci >= 0) {
                    int sp = ua.indexOf(' ', ci);
                    wv = ua.substring(ci, sp > ci ? sp : ua.length());
                }
            } catch (Throwable ignored) {}
            String m = "real=" + real.widthPixels + "x" + real.heightPixels
                    + " view=" + vw + "x" + vh
                    + " decor=" + dw + "x" + dh
                    + " appDpi=" + appDpi + " realDpi=" + realDpi
                    + " nkid=" + nk + kids
                    + " model=" + Build.MODEL
                    + " wv=" + wv;
            String esc = m.replace("\\", "\\\\").replace("'", "\\'");
            webView.evaluateJavascript(
                    "(function(){window.IGRA_ANDROID_METRICS='" + esc + "';"
                            + "if(window.IGRA&&IGRA.app&&IGRA.app.resize)IGRA.app.resize();})()",
                    null);
        } catch (Throwable ignored) {}
    }

    private boolean fitFixed = false;

    private void probeFitIntegrity() {
        if (webView == null || fitFixed) return;
        try {
            final int vw = webView.getWidth();
            final int vh = webView.getHeight();
            if (vw < 8 || vh < 8) return;
            webView.evaluateJavascript(
                    "(function(){window.IGRA_TOUCH_EAT=1;window.IGRA_TOUCH_LAST='';})()", null);
            webView.postDelayed(new Runnable() {
                public void run() {
                    try {
                        long now = SystemClock.uptimeMillis();
                        MotionEvent dn = MotionEvent.obtain(now, now,
                                MotionEvent.ACTION_DOWN, vw - 6, vh - 6, 0);
                        webView.dispatchTouchEvent(dn);
                        MotionEvent up = MotionEvent.obtain(now, now + 30,
                                MotionEvent.ACTION_UP, vw - 6, vh - 6, 0);
                        webView.dispatchTouchEvent(up);
                        dn.recycle();
                        up.recycle();
                    } catch (Throwable ignored) {}
                }
            }, 250);
            webView.postDelayed(new Runnable() {
                public void run() { readProbe(vw, vh); }
            }, 900);
        } catch (Throwable ignored) {}
    }

    private void readProbe(final int vw, final int vh) {
        if (webView == null) return;
        try {
            webView.evaluateJavascript(
                    "(function(){var r=(window.IGRA_TOUCH_LAST||'');window.IGRA_TOUCH_EAT=0;"
                            + "return r+'|'+(window.innerWidth||0)+'x'+(window.innerHeight||0);})()",
                    new android.webkit.ValueCallback<String>() {
                        @Override public void onReceiveValue(String value) {
                            try {
                                String v = value == null ? "" : value.replace("\"", "");
                                String[] half = v.split("\\|");
                                if (half.length != 2 || half[0].length() == 0) return;
                                String[] xy = half[0].split(",");
                                String[] wh = half[1].split("x");
                                float x = Float.parseFloat(xy[0]);
                                float y = Float.parseFloat(xy[1]);
                                float iw = Float.parseFloat(wh[0]);
                                float ih = Float.parseFloat(wh[1]);
                                if (iw < 8 || ih < 8) return;
                                if (x > iw + 1.5f || y > ih + 1.5f) {
                                    // Краска 1:1: касание угла окна приземлилось
                                    // за пределами CSS-вьюпорта. Растягиваем View
                                    // матрицей — пиксели и касания остаются согласны.
                                    float sx = vw / iw;
                                    float sy = vh / ih;
                                    webView.setPivotX(0);
                                    webView.setPivotY(0);
                                    webView.setScaleX(sx);
                                    webView.setScaleY(sy);
                                    fitFixed = true;
                                    markProbe("fix=view-matrix x" + sx + " y" + sy);
                                } else {
                                    markProbe("probe=ok");
                                }
                            } catch (Throwable ignored) {}
                        }
                    });
        } catch (Throwable ignored) {}
    }

    private void markProbe(String note) {
        try {
            webView.evaluateJavascript(
                    "(function(){window.IGRA_ANDROID_METRICS=(window.IGRA_ANDROID_METRICS||'')+' "
                            + note + "';"
                            + "if(window.IGRA&&IGRA.app&&IGRA.app.resize)IGRA.app.resize();})()",
                    null);
        } catch (Throwable ignored) {}
    }

    private void hideSystemUi() {
        try {
            View decor = getWindow().getDecorView();
            if (decor != null) {
                decor.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUi();
            if (webView != null) {
                webView.postDelayed(new Runnable() {
                    public void run() { resizeGame(); }
                }, 100);
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            try {
                webView.evaluateJavascript(
                        "window.IGRA && IGRA.onBack && IGRA.onBack()", null);
            } catch (Throwable ignored) {}
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            try {
                webView.onPause();
                webView.evaluateJavascript(
                        "window.IGRA && IGRA.pause && IGRA.pause()", null);
            } catch (Throwable ignored) {}
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
        if (webView != null) {
            try {
                webView.onResume();
                webView.evaluateJavascript(
                        "window.IGRA && IGRA.resume && IGRA.resume()", null);
                webView.postDelayed(new Runnable() {
                    public void run() { resizeGame(); }
                }, 100);
            } catch (Throwable ignored) {}
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            try {
                webView.destroy();
                webView = null;
            } catch (Throwable ignored) {}
        }
        super.onDestroy();
    }
}

