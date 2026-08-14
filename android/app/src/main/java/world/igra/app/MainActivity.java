package world.igra.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
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

            webView = new WebView(this);
            webView.setBackgroundColor(0xFF05060A);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            // WebView may measure MATCH_PARENT in CSS pixels on devices that
            // expose 384 px CSS width for a 576 px physical display. Give the
            // view the physical display bounds directly; do not scale the view,
            // otherwise HTML controls are painted outside the visible screen.
            android.util.DisplayMetrics realMetrics = new android.util.DisplayMetrics();
            getWindowManager().getDefaultDisplay().getRealMetrics(realMetrics);
            webView.setLayoutParams(new ViewGroup.LayoutParams(
                    realMetrics.widthPixels,
                    realMetrics.heightPixels));
            webView.setWebViewClient(new AssetClient(getAssets()));
            webView.setWebChromeClient(new WebChromeClient());

            WebSettings s = webView.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            s.setDatabaseEnabled(true);
            s.setMediaPlaybackRequiresUserGesture(false);
            s.setAllowFileAccess(true);
            s.setAllowContentAccess(true);
            s.setAllowFileAccessFromFileURLs(true);
            s.setAllowUniversalAccessFromFileURLs(true);
            // The phone reports a CSS viewport (for example 384 px on a 576 px
            // screen with density 1.5). Keep the viewport for layout, but render
            // it at the physical density so the WebView does not occupy only the
            // left CSS-width slice of the display.
            s.setUseWideViewPort(true);
            s.setLoadWithOverviewMode(false);
            // Keep WebView zoom at 100%; the post-layout physical scale below
            // fills the display, while JavaScript maps touch coordinates back
            // into the CSS viewport.
            webView.setInitialScale(100);
            s.setSupportZoom(false);
            s.setBuiltInZoomControls(false);
            s.setDisplayZoomControls(false);
            s.setTextZoom(100);
            s.setCacheMode(WebSettings.LOAD_NO_CACHE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                s.setSafeBrowsingEnabled(false);
            }

            setContentView(webView);
            webView.post(new Runnable() {
                public void run() { applyPhysicalViewport(); }
            });
            webView.loadUrl("https://igra.local/www/index.html");
            webView.postDelayed(new Runnable() {
                public void run() { applyPhysicalViewport(); }
            }, 900);
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

    private void applyPhysicalViewport() {
        if (webView == null) return;
        try {
            android.util.DisplayMetrics real = new android.util.DisplayMetrics();
            getWindowManager().getDefaultDisplay().getRealMetrics(real);
            android.util.DisplayMetrics system = getResources().getDisplayMetrics();
            int currentW = 0;
            int currentH = 0;
            int maximumW = 0;
            int maximumH = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.view.WindowMetrics current = getWindowManager().getCurrentWindowMetrics();
                android.graphics.Rect currentBounds = current.getBounds();
                currentW = currentBounds.width();
                currentH = currentBounds.height();
                android.view.WindowMetrics maximum = getWindowManager().getMaximumWindowMetrics();
                android.graphics.Rect maximumBounds = maximum.getBounds();
                maximumW = maximumBounds.width();
                maximumH = maximumBounds.height();
            }
            int vw = webView.getWidth();
            int vh = webView.getHeight();
            if (vw < 8 || vh < 8) {
                webView.postDelayed(new Runnable() {
                    public void run() { applyPhysicalViewport(); }
                }, 120);
                return;
            }
            float sx = (float) real.widthPixels / (float) vw;
            float sy = (float) real.heightPixels / (float) vh;
            // Oukitel G1 Android 15 can lay out WebView in CSS pixels while
            // the window is painted in physical pixels. Apply the correction
            // only after layout, otherwise Android resets it during attach.
            // View scale stays at 1.0: native WebView zoom owns both pixels
            // and touch mapping.
            String diagnostic = "android real=" + real.widthPixels + "x" + real.heightPixels
                    + " current=" + currentW + "x" + currentH
                    + " max=" + maximumW + "x" + maximumH
                    + " system=" + system.widthPixels + "x" + system.heightPixels
                    + " view=" + vw + "x" + vh
                    + " scale=" + sx + "x" + sy;
            String escaped = diagnostic.replace("\\", "\\\\").replace("'", "\\'");
            webView.evaluateJavascript(
                    "(function(){if(window.IGRA&&IGRA.app&&IGRA.app.resize)IGRA.app.resize();"
                    + "var e=document.getElementById('fit-debug');if(e)e.textContent='" + escaped + "';})()", null);
            // The CSS viewport can be narrower than the laid-out Android View.
            // Measure it after the page exists, then scale the WebView to the
            // physical display width (384 CSS px -> 576 physical px on G1).
            webView.evaluateJavascript(
                    "(window.innerWidth||0)+','+(window.innerHeight||0)",
                    new android.webkit.ValueCallback<String>() {
                        @Override public void onReceiveValue(String value) {
                            try {
                                String v = value.replace("\"", "");
                                String[] parts = v.split(",");
                                float cssW = Float.parseFloat(parts[0]);
                                float cssH = Float.parseFloat(parts[1]);
                                if (cssW < 8 || cssH < 8) return;
                                float cssScaleX = real.widthPixels / cssW;
                                float cssScaleY = real.heightPixels / cssH;
                                webView.setScaleX(1f);
                                webView.setScaleY(1f);
                                String physicalW = String.valueOf(real.widthPixels);
                                String physicalH = String.valueOf(real.heightPixels);
                                String d = "android real=" + real.widthPixels + "x" + real.heightPixels
                                        + " css=" + ((int) cssW) + "x" + ((int) cssH)
                                        + " scale=1x1 viewport=physical";
                                String e = d.replace("'", "\\'");
                                String js = "(function(){"
                                        + "var m=document.querySelector('meta[name=viewport]');"
                                        + "if(m)m.setAttribute('content','width=" + physicalW + ",height=" + physicalH + ",initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover');"
                                        + "document.documentElement.style.width='" + physicalW + "px';"
                                        + "document.documentElement.style.height='" + physicalH + "px';"
                                        + "document.body.classList.remove('android-compact');"
                                        + "if(window.IGRA&&IGRA.app&&IGRA.app.resize)IGRA.app.resize();"
                                        + "var e=document.getElementById('fit-debug');if(e)e.textContent='" + e + "';})()";
                                webView.evaluateJavascript(js, null);
                            } catch (Throwable ignored) {}
                        }
                    });
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
                    public void run() {
                        try {
                            if (webView != null) {
                                applyPhysicalViewport();
                            }
                        } catch (Throwable ignored) {}
                    }
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
                    public void run() {
                        try {
                            if (webView != null) {
                                applyPhysicalViewport();
                            }
                        } catch (Throwable ignored) {}
                    }
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
