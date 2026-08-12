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
import android.widget.FrameLayout;

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

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF05060A);
        root.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF05060A);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        webView.setWebViewClient(new AssetClient(getAssets(), this));
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

        root.addView(webView);
        setContentView(root);

        webView.post(new Runnable() {
            public void run() {
                applyPhysicalViewport(true);
            }
        });
    }

    void applyPhysicalViewport(boolean load) {
        if (webView == null) return;
        int pw = webView.getWidth();
        int ph = webView.getHeight();
        if (pw < 8 || ph < 8) {
            pw = getResources().getDisplayMetrics().widthPixels;
            ph = getResources().getDisplayMetrics().heightPixels;
        }
        if (pw < 8 || ph < 8) return;

        webView.setInitialScale(100);
        final String js =
                "(function(){"
                + "var w=" + pw + ",h=" + ph + ";"
                + "var m=document.querySelector('meta[name=viewport]');"
                + "if(m)m.setAttribute('content','width='+w+',height='+h+',initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no');"
                + "document.documentElement.style.cssText='width:'+w+'px;height:'+h+'px;margin:0;overflow:hidden;background:#05060a';"
                + "if(document.body)document.body.style.cssText='width:'+w+'px;height:'+h+'px;margin:0;overflow:hidden;background:#05060a';"
                + "var a=document.getElementById('app');"
                + "if(a)a.style.cssText='position:fixed;left:0;top:0;width:'+w+'px;height:'+h+'px;background:#05060a';"
                + "document.documentElement.style.zoom='1';"
                + "window.__IGRA_VW=w;window.__IGRA_VH=h;"
                + "window.__IGRA_PX_W=w;window.__IGRA_PX_H=h;window.__IGRA_ZOOM=1;"
                + "if(window.IGRA&&IGRA.app&&IGRA.app.resize)IGRA.app.resize();"
                + "})()";
        webView.evaluateJavascript(js, null);

        if (load) {
            webView.loadUrl("https://igra.local/www/index.html?w=" + pw + "&h=" + ph);
        }
    }

    private static class AssetClient extends WebViewClient {
        private final AssetManager assets;
        private final MainActivity host;

        AssetClient(AssetManager assets, MainActivity host) {
            this.assets = assets;
            this.host = host;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri == null) return null;
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

        @Override
        public void onPageFinished(WebView view, String url) {
            view.postDelayed(new Runnable() {
                public void run() { host.applyPhysicalViewport(false); }
            }, 40);
            view.postDelayed(new Runnable() {
                public void run() { host.applyPhysicalViewport(false); }
            }, 250);
            view.postDelayed(new Runnable() {
                public void run() { host.applyPhysicalViewport(false); }
            }, 700);
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

    private void hideSystemUi() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUi();
            if (webView != null) webView.postDelayed(new Runnable() {
                public void run() { applyPhysicalViewport(false); }
            }, 30);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                    "window.IGRA && IGRA.onBack && IGRA.onBack()", null);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
            webView.evaluateJavascript(
                    "window.IGRA && IGRA.pause && IGRA.pause()", null);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript(
                    "window.IGRA && IGRA.resume && IGRA.resume()", null);
            webView.postDelayed(new Runnable() {
                public void run() { applyPhysicalViewport(false); }
            }, 50);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
