import java.util.*;
import java.util.zip.*;

/**
 * Standalone functional test: replays MainActivity.serve()'s EXACT lookup
 * sequence (exact → /index.html → .html → SPA fallback) against the real
 * APK's zip entries, emulating AssetManager.open() semantics
 * (open("www/index.html") ⇔ zip entry "assets/www/index.html").
 */
public class ServeTest {
    static final String ASSET_ROOT = "www";   // MainActivity.ASSET_ROOT
    static Set<String> zipNames;

    /** Emulates AssetManager.open(): null when the asset doesn't exist. */
    static String openOrNull(String p) {
        return zipNames.contains("assets/" + p) ? "assets/" + p : null;
    }

    /** Mirror of MainActivity.serve() — returns the resolved asset path. */
    static String serve(String rawPath) {
        String path = rawPath == null || rawPath.isEmpty() ? "/" : rawPath;
        if (path.startsWith("/")) path = path.substring(1);
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);
        if (path.isEmpty() || path.endsWith("/")) path += "index.html";

        String ap = ASSET_ROOT + "/" + path;
        String in = openOrNull(ap);
        if (in == null) in = openOrNull(ap + "/index.html");
        if (in == null) in = openOrNull(ap + ".html");
        if (in == null) in = openOrNull(ASSET_ROOT + "/index.html");
        return in; // null ⇒ would fall to network ⇒ the v1.1.0 bug
    }

    public static void main(String[] a) throws Exception {
        String apk = a[0];
        zipNames = new HashSet<>();
        try (ZipFile z = new ZipFile(apk)) {
            Enumeration<? extends ZipEntry> e = z.entries();
            while (e.hasMoreElements()) zipNames.add(e.nextElement().getName());
        }

        // pick a real chunk name from the APK to test a deep static path
        String chunk = null;
        for (String n : zipNames)
            if (n.startsWith("assets/www/_next/static/chunks/") && n.endsWith(".js")) {
                chunk = "/" + n.substring("assets/www/".length()); break;
            }

        int pass = 0, fail = 0;
        String[][] tests = {
                {"main frame /", "/"},
                {"admin page", "/admin"},
                {"admin index.html", "/admin/index.html"},
                {"manifest", "/manifest.webmanifest"},
                {"deep chunk", chunk},
                {"missing page (SPA fallback)", "/some/unknown/route"},
                {"missing deep page (SPA fallback)", "/foo/bar/"}
        };
        for (String[] t : tests) {
            String resolved = serve(t[1]);
            boolean ok = resolved != null;
            if (ok) pass++; else fail++;
            System.out.printf("%-35s %-28s → %s%n", t[0], t[1],
                    ok ? "OK  " + resolved : "FAIL (null → network → DNS error!)");
        }
        // regression: the OLD (buggy) logic must fail, proving we found the bug
        String oldBug = openOrNull("index.html"); // v1.1.0 looked up without www/
        System.out.printf("%-35s %-28s → %s%n", "v1.1.0 lookup (bug, must be null)", "/",
                oldBug == null ? "null (confirms root cause)" : "found?!");

        System.out.println(fail == 0 ? "ALL SERVE PATHS OK" : (fail + " PATHS FAILED"));
        if (fail != 0 || oldBug != null) System.exit(1);
    }
}
