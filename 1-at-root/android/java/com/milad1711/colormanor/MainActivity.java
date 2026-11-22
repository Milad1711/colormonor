package com.milad1711.colormanor;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.android.vending.billing.IInAppBillingService;
import java.io.InputStream;
import java.net.URLDecoder;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Color Manor — Café Bazaar APK shell (v1.1.4).
 *
 * v1.1.1 FIX (the "Web page not available / ERR_NAME_NOT_RESOLVED" bug):
 * AssetManager.open() resolves paths relative to the APK's assets/ root,
 * while the game lives in assets/www/…  v1.1.0 looked assets up WITHOUT the
 * "www/" prefix, so every request fell through to the network and the
 * reserved private host could not be resolved by DNS. All lookups now go
 * through ASSET_ROOT, the main frame can never fall back to the network
 * (SPA fallback), and as a last resort the game is loaded directly from
 * file:///android_asset/www/index.html if the main frame ever errors out.
 *
 * 1. Serves the statically-exported Next.js game from assets/www on the
 *    private origin https://appassets.androidplatform.net (the origin the
 *    Android documentation reserves for app-local web assets), so the whole
 *    game works fully offline and localStorage persists per app.
 *
 * 2. Café Bazaar IN-APP BILLING (IAB v3 protocol, per Poolakey 2.3.0 — the
 *    official Café Bazaar billing library — this is the same protocol,
 *    hand-rolled in plain Java so no Gradle/Kotlin toolchain is needed):
 *      - binds to com.farsitel.bazaar's InAppBillingService via the AIDL
 *        interface com.android.vending.billing.IInAppBillingService and the
 *        action "ir.cafebazaar.pardakht.InAppBillingService.BIND",
 *      - apiVersion 3, type "inapp",
 *      - getBuyIntent → BUY_INTENT PendingIntent → Bazaar's payment dialog,
 *      - INAPP_PURCHASE_DATA + INAPP_DATA_SIGNATURE verified with the
 *        developer RSA key (SHA1withRSA, X509EncodedKeySpec — exactly like
 *        Poolakey's PurchaseVerifier),
 *      - consumePurchase after every successful coin pack.
 *
 *    The JS side talks to this through window.ColorManorBridge
 *    (@see CoinPacks.tsx + src/lib/bazaar.ts) and receives events on
 *    window.__bazaar.onEvent({...}).
 */
public class MainActivity extends Activity {

    /** Private host reserved by the Android docs for local app assets. */
    static final String HOST = "appassets.androidplatform.net";
    static final String SPLASH = "#FAE7C8";

    /** Game files live in assets/<ASSET_ROOT>/… inside the APK. AssetManager
     *  paths are relative to assets/, so every lookup MUST be prefixed. */
    static final String ASSET_ROOT = "www";
    /** Set once the file:// last-resort fallback ran (prevents error loops). */
    private volatile boolean offlineFallbackUsed;

    // ------------------------------------------------- Café Bazaar billing
    static final String BAZAAR_PACKAGE = "com.farsitel.bazaar";
    static final String BILLING_ACTION = "ir.cafebazaar.pardakht.InAppBillingService.BIND";
    static final String BILLING_CLASS  =
            "com.farsitel.bazaar.inappbilling.service.InAppBillingService";
    static final int    BILLING_API_V = 3;
    static final int    REQ_BUY = 9001;

    /** Developer RSA public key from the Café Bazaar developer panel
     *  (پنل توسعه‌دهندگان → درون‌پرداخت). Verifies INAPP_DATA_SIGNATURE.
     *  Replace here if the panel key ever rotates. */
    static final String RSA_KEY =
        "MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCNLxwkpKff9EH0ogM3cDtTXYRKEdXXhk6H4KyCd4sAU2FJdRjtGkz2UNvK5jyXAjkqyW2GqCpOdCWuwBOEp5R7ATlKhBPFqJgU0ET5nmCzihnyHJHvK/rtXQJrm2y3m8cQveVeKexkTBhsTGYxx2bZqXX+lx39c4z+BIq86CA8gdVTDAdVK8Ph7NN2c8e/OHjRQv/26/CKbcqcSzETu8b1GJgPn3G4Fvr9k80W/EkCAwEAAQ==";

    private static final int RESPONSE_OK          = 0;
    private static final int RESPONSE_USER_CANCEL = 1;

    private WebView web;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    private volatile IInAppBillingService billing;
    private volatile boolean billingBound;
    private volatile boolean bazaarInstalled;
    private volatile PublicKey rsaKey;
    /** Purchase waiting for the billing service to finish connecting. */
    private volatile String[] pendingBuy;

    private final ServiceConnection billingConn = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder service) {
            billing = IInAppBillingService.Stub.asInterface(service);
            jsEvent(connectedEvent());
            String[] p = pendingBuy;
            if (p != null) {
                pendingBuy = null;
                final String productId = p[0], payload = p[1];
                io.execute(() -> beginPurchase(productId, payload));
            }
        }
        @Override public void onServiceDisconnected(ComponentName name) {
            billing = null;
        }
    };

    // ================================================================== life
    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(SPLASH));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);            // localStorage — the save file
        // file:// is used only by the last-resort offline fallback (onReceivedError).
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        // v1.1.2: popup windows DISABLED. With multi-window support on, the
        // admin entries (<a target="_blank">, window.open) went through
        // onCreateWindow's temp WebView, whose first navigation does not
        // reliably fire shouldOverrideUrlLoading — the admin page loaded
        // inside an invisible detached WebView and nothing appeared on
        // screen. With support off, window.open/target=_blank navigate the
        // main WebView in place (intercepted → admin panel shows).
        s.setSupportMultipleWindows(false);
        s.setGeolocationEnabled(false);

        web.addJavascriptInterface(new Bridge(), "ColorManorBridge");
        web.setWebViewClient(new LocalClient());
        web.setWebChromeClient(new Chrome());
        setContentView(web);
        web.loadUrl("https://" + HOST + "/");
        enterImmersive();

        // key + availability once, off the UI thread
        io.execute(() -> {
            try {
                rsaKey = KeyFactory.getInstance("RSA")
                        .generatePublic(new X509EncodedKeySpec(
                                android.util.Base64.decode(RSA_KEY, android.util.Base64.DEFAULT)));
            } catch (Exception e) {
                rsaKey = null;
                android.util.Log.w("ColorManor", "RSA key parse failed — verification disabled", e);
            }
            bazaarInstalled = queryBazaarService();
            jsEvent(obj(
                "type", "bridge", "ok", true,
                "bazaarInstalled", bazaarInstalled,
                "signatureCheck", rsaKey != null));
        });
        connectBilling();
    }

    /** Can Bazaar's billing service be seen? (package visibility via <queries>) */
    private boolean queryBazaarService() {
        try {
            Intent probe = new Intent(BILLING_ACTION).setPackage(BAZAAR_PACKAGE);
            return !getPackageManager().queryIntentServices(probe, 0).isEmpty()
                    || !getPackageManager().queryIntentServices(
                            new Intent(BILLING_ACTION).setPackage("com.farsitel.bazaar.tv"), 0).isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private void connectBilling() {
        if (billingBound || billing != null) return;
        try {
            Intent intent = new Intent(BILLING_ACTION);
            intent.setPackage(BAZAAR_PACKAGE);
            intent.setClassName(BAZAAR_PACKAGE, BILLING_CLASS);
            billingBound = bindService(intent, billingConn, Context.BIND_AUTO_CREATE);
            if (!billingBound) billing = null;
        } catch (Exception e) {
            billingBound = false;
            billing = null;
        }
    }

    private void disconnectBilling() {
        if (billingBound) {
            try { unbindService(billingConn); } catch (Exception ignored) { }
            billingBound = false;
        }
        billing = null;
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersive();
    }

    private void enterImmersive() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
    }

    // ============================================================ JS bridge
    /** Exposed to JavaScript as window.ColorManorBridge. */
    public class Bridge {
        @JavascriptInterface public boolean isBazaarAvailable() { return bazaarInstalled; }
        @JavascriptInterface public boolean isSignatureCheckEnabled() { return rsaKey != null; }

        /** Launch Bazaar's payment dialog for one coin pack. */
        @JavascriptInterface public void buy(String productId, String payload) {
            if (billing != null) {
                io.execute(() -> beginPurchase(productId, payload));
            } else if (bazaarInstalled) {
                pendingBuy = new String[] { productId, payload == null ? "" : payload };
                main.post(MainActivity.this::connectBilling);
            } else {
                jsEvent(obj("type", "purchase", "ok", false,
                        "error", "bazaar_missing", "productId", productId));
            }
        }

        /** Report every unconsumed purchase so the JS side can grant coins. */
        @JavascriptInterface public void restore() {
            io.execute(MainActivity.this::queryPurchases);
        }

        /** Consume one coin pack so the user can buy it again. */
        @JavascriptInterface public void consume(String token) {
            io.execute(() -> consumeToken(token));
        }
    }

    // ========================================================== billing flow
    private void beginPurchase(String productId, String payload) {
        IInAppBillingService svc = billing;
        if (svc == null) {
            jsEvent(obj("type", "purchase", "ok", false,
                    "error", bazaarInstalled ? "not_connected" : "bazaar_missing",
                    "productId", productId));
            return;
        }
        try {
            Bundle b = svc.getBuyIntent(BILLING_API_V, getPackageName(), productId, "inapp", payload);
            int response = b == null ? RESPONSE_OK : b.getInt("RESPONSE_CODE", RESPONSE_OK);
            if (b == null || response != RESPONSE_OK) {
                jsEvent(obj("type", "purchase", "ok", false, "error", "begin_failed",
                        "responseCode", response, "productId", productId));
                return;
            }
            final android.app.PendingIntent pi = b.getParcelable("BUY_INTENT");
            if (pi == null) {
                jsEvent(obj("type", "purchase", "ok", false, "error", "begin_failed",
                        "productId", productId));
                return;
            }
            main.post(() -> {
                try {
                    startIntentSenderForResult(pi.getIntentSender(), REQ_BUY,
                            new Intent(), 0, 0, 0);
                } catch (IntentSender.SendIntentException e) {
                    jsEvent(obj("type", "purchase", "ok", false, "error", "begin_failed",
                            "productId", productId));
                }
            });
        } catch (Exception e) {
            jsEvent(obj("type", "purchase", "ok", false, "error", "exception",
                    "message", String.valueOf(e), "productId", productId));
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_BUY) return;
        final Intent result = data;
        io.execute(() -> handlePurchaseResult(resultCode, result));
    }

    private void handlePurchaseResult(int resultCode, Intent data) {
        if (resultCode != RESULT_OK || data == null) {
            jsEvent(obj("type", "purchase", "ok", false, "error", "cancelled"));
            return;
        }
        int response = data.getIntExtra("RESPONSE_CODE", RESPONSE_OK);
        if (response == RESPONSE_USER_CANCEL) {
            jsEvent(obj("type", "purchase", "ok", false, "error", "cancelled"));
            return;
        }
        if (response != RESPONSE_OK) {
            jsEvent(obj("type", "purchase", "ok", false, "error", "purchase_failed",
                    "responseCode", response));
            return;
        }
        String purchaseData = data.getStringExtra("INAPP_PURCHASE_DATA");
        String signature    = data.getStringExtra("INAPP_DATA_SIGNATURE");
        if (purchaseData == null || purchaseData.isEmpty()) {
            jsEvent(obj("type", "purchase", "ok", false, "error", "no_data"));
            return;
        }
        try {
            JSONObject p = new JSONObject(purchaseData);
            String productId = p.optString("productId");
            String token     = p.optString("purchaseToken");
            String payload   = p.optString("developerPayload");
            String orderId   = p.optString("orderId");
            int state        = p.optInt("purchaseState", -1);
            String pkg       = p.optString("packageName");

            if (state != 0) {  // 0 = PURCHASED
                jsEvent(obj("type", "purchase", "ok", false, "error", "bad_state",
                        "productId", productId));
                return;
            }
            if (pkg.length() > 0 && !pkg.equals(getPackageName())) {
                jsEvent(obj("type", "purchase", "ok", false, "error", "wrong_package",
                        "productId", productId));
                return;
            }
            if (signature != null && !signature.isEmpty() && rsaKey != null
                    && !verifySignature(purchaseData, signature)) {
                jsEvent(obj("type", "purchase", "ok", false, "error", "verify_failed",
                        "productId", productId));
                return;
            }
            jsEvent(obj("type", "purchase", "ok", true,
                    "productId", productId, "token", token,
                    "payload", payload, "orderId", orderId));
        } catch (Exception e) {
            jsEvent(obj("type", "purchase", "ok", false, "error", "exception",
                    "message", String.valueOf(e)));
        }
    }

    /** Poolakey-style verification: SHA1withRSA over the raw purchase JSON. */
    private boolean verifySignature(String signedData, String signature) {
        try {
            Signature sig = Signature.getInstance("SHA1withRSA");
            sig.initVerify(rsaKey);
            sig.update(signedData.getBytes("UTF-8"));
            return sig.verify(android.util.Base64.decode(signature, android.util.Base64.DEFAULT));
        } catch (Exception e) {
            return false;
        }
    }

    private void queryPurchases() {
        IInAppBillingService svc = billing;
        if (svc == null) {
            jsEvent(obj("type", "restore", "purchases", new JSONArray()));
            return;
        }
        try {
            ArrayList<JSONObject> found = new ArrayList<>();
            String continuation = null;
            int guard = 0;
            do {
                Bundle b = svc.getPurchases(BILLING_API_V, getPackageName(), "inapp", continuation);
                if (b == null) break;
                ArrayList<String> dataList = b.getStringArrayList("INAPP_PURCHASE_DATA_LIST");
                ArrayList<String> sigList  = b.getStringArrayList("INAPP_DATA_SIGNATURE_LIST");
                if (dataList != null) {
                    for (int i = 0; i < dataList.size(); i++) {
                        try {
                            JSONObject p = new JSONObject(dataList.get(i));
                            String sig = sigList != null && i < sigList.size() ? sigList.get(i) : "";
                            p.put("_signaturePresent",
                                    sig != null && !sig.isEmpty() &&
                                    (rsaKey == null || verifySignature(dataList.get(i), sig)));
                            found.add(p);
                        } catch (Exception ignored) { }
                    }
                }
                continuation = b.getString("INAPP_CONTINUATION_TOKEN");
            } while (continuation != null && ++guard < 10);

            JSONArray arr = new JSONArray();
            for (JSONObject p : found) {
                JSONObject o = new JSONObject();
                o.put("productId", p.optString("productId"));
                o.put("token", p.optString("purchaseToken"));
                o.put("payload", p.optString("developerPayload"));
                o.put("orderId", p.optString("orderId"));
                o.put("purchaseState", p.optInt("purchaseState", -1));
                o.put("signatureOk", p.optBoolean("_signaturePresent", false));
                arr.put(o);
            }
            jsEvent(obj("type", "restore", "purchases", arr));
        } catch (Exception e) {
            jsEvent(obj("type", "restore", "error", String.valueOf(e), "purchases", new JSONArray()));
        }
    }

    private void consumeToken(String token) {
        IInAppBillingService svc = billing;
        if (svc == null || token == null || token.isEmpty()) {
            jsEvent(obj("type", "consumed", "ok", false, "token", token == null ? "" : token));
            return;
        }
        try {
            int r = svc.consumePurchase(BILLING_API_V, getPackageName(), token);
            jsEvent(obj("type", "consumed", "ok", r == RESPONSE_OK,
                    "responseCode", r, "token", token));
        } catch (Exception e) {
            jsEvent(obj("type", "consumed", "ok", false, "token", token,
                    "message", String.valueOf(e)));
        }
    }

    // ================================================================= JSON
    private static JSONObject obj(Object... kv) {
        JSONObject o = new JSONObject();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            try { o.put(String.valueOf(kv[i]), kv[i + 1]); } catch (Exception ignored) { }
        }
        return o;
    }

    private static JSONObject connectedEvent() {
        return obj("type", "connected", "ok", true);
    }

    /** Deliver one event to the game: window.__bazaar.onEvent({...}) */
    private void jsEvent(final JSONObject event) {
        final String json = String.valueOf(event);
        main.post(() -> {
            if (web == null) return;
            web.evaluateJavascript(
                    "window.__bazaar && window.__bazaar.onEvent && window.__bazaar.onEvent(" + json + ");",
                    null);
        });
    }

    // ============================================================== webview
    /** Maps every request to https://HOST/... onto assets/www/... */
    private class LocalClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (u == null || !HOST.equals(u.getHost())) return null;
            try {
                WebResourceResponse r = serve(u.getPath());
                if (r == null && req.isForMainFrame()) {
                    // Never send the main frame to the network — this host does
                    // not exist on DNS and would show "Web page not available".
                    r = serve("/index.html");
                }
                return r;
            } catch (Exception e) {
                try {
                    return serve("/index.html");
                } catch (Exception e2) {
                    return null;
                }
            }
        }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
            maybeOfflineFallback(req.getUrl());
        }

        /** @deprecated API 21/22 path (fires for older WebViews). */
        @Override @Deprecated
        public void onReceivedError(WebView v, int code, String desc, String failingUrl) {
            maybeOfflineFallback(failingUrl == null ? null : Uri.parse(failingUrl));
        }
    }

    /** If the main page ever fails to load (serving broken, WebView quirk),
     *  load the game straight from assets via file:// — the app can never
     *  dead-end on the WebView "Web page not available" screen. Runs once. */
    private void maybeOfflineFallback(Uri u) {
        if (offlineFallbackUsed || u == null || !HOST.equals(u.getHost())) return;
        offlineFallbackUsed = true;
        main.post(() -> {
            if (web != null) {
                web.loadUrl("file:///android_asset/" + ASSET_ROOT + "/index.html");
            }
        });
    }

    /** window.open("/admin", "_blank") → route the URL in the main webview. */
    private class Chrome extends WebChromeClient {
        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog,
                                      boolean isUserGesture, Message resultMsg) {
            WebView tmp = new WebView(view.getContext());
            tmp.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                    web.loadUrl(req.getUrl().toString());
                    return true;
                }
            });
            ((WebView.WebViewTransport) resultMsg.obj).setWebView(tmp);
            return true;
        }
    }

    /** Serve one asset path with index.html fallbacks, like a static host.
     *  All lookups are prefixed with ASSET_ROOT — AssetManager resolves
     *  relative to assets/, and the game lives in assets/www/. */
    private WebResourceResponse serve(String rawPath) throws Exception {
        String path = URLDecoder.decode(
                rawPath == null || rawPath.isEmpty() ? "/" : rawPath, "UTF-8");
        if (path.startsWith("/")) path = path.substring(1);
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);
        if (path.isEmpty() || path.endsWith("/")) path += "index.html";

        String ap = ASSET_ROOT + "/" + path;                       // www/<path>
        AssetManager am = getAssets();
        InputStream in = openOrNull(am, ap);                       // exact file
        if (in == null) in = openOrNull(am, ap + "/index.html");   // /admin → admin/index.html
        if (in == null) in = openOrNull(am, ap + ".html");         // /admin → admin.html
        if (in == null) in = openOrNull(am, ASSET_ROOT + "/index.html"); // SPA fallback
        if (in == null) return null;                               // index.html itself missing
        return new WebResourceResponse(guessMime(path), null, in);
    }

    private static InputStream openOrNull(AssetManager am, String p) {
        try {
            return am.open(p);
        } catch (Exception e) {
            return null;
        }
    }

    private static String guessMime(String path) {
        String ext = "";
        int dot = path.lastIndexOf('.');
        if (dot >= 0) ext = path.substring(dot + 1).toLowerCase();
        switch (ext) {
            case "html": case "htm": return "text/html";
            case "js": case "mjs":   return "text/javascript";
            case "css":              return "text/css";
            case "json": case "map": case "webmanifest": return "application/json";
            case "svg":              return "image/svg+xml";
            case "png":              return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "gif":              return "image/gif";
            case "webp":             return "image/webp";
            case "ico":              return "image/x-icon";
            case "woff":             return "font/woff";
            case "woff2":            return "font/woff2";
            case "ttf":              return "font/ttf";
            case "otf":              return "font/otf";
            case "mp3":              return "audio/mpeg";
            case "wav":              return "audio/wav";
            case "ogg":              return "audio/ogg";
            case "mp4":              return "video/mp4";
            case "txt":              return "text/plain";
            default:
                String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                return m != null ? m : "application/octet-stream";
        }
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); enterImmersive(); }

    @Override protected void onDestroy() {
        disconnectBilling();
        io.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
