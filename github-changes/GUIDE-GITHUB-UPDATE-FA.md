# به‌روزرسانی گیت‌هاب — فایل‌های نسخهٔ ۱.۱٫۴ + کیت تعمیر سرور

این پکیج **۳۴ فایل** دارد؛ کل ریپو نیست. ساختار پوشه‌ها دقیقاً مثل خود ریپو است.
این نسخه فقط بازی را عوض نمی‌کند — **سرور ورسل تو را هم تعمیر می‌کند** (دلیل «ارتباط
برقرار نشد» معرفی دوستان همین بود: سرورِ دیپلوی‌شده، CORS و Turso ندارد).

> **۱.۱٫۴ = لینک واقعی ورسل حک شد + دکمهٔ کپی شناسهٔ دستگاه + پاداش معرفی ۲۰۰ + سقف گردونه ۳۰۰**
> **۱.۱٫۳ = پنل ادمین به سرور وصل شد + تنظیم «سرور آنلاین» داخل بازی**

---

## گام ۱ — آپلود در سایت گیت‌هاب (بدون گیت‌هاب دسکتاپ)

۱. در مرورگر برو به: `https://github.com/<نام-کاربری>/<نام-ریپو>`
۲. **Add file → Upload files**
۳. **پوشه‌ها را با خود پوشه بکش و رها کن**:
   - پوشهٔ `android`
   - پوشهٔ `scripts`
   - پوشهٔ `src`
۴. سه فایل ریشه را جداگانه اضافه کن:
   - `.gitignore`
   - `README-APK-FA.md`
   - `package.json` ← **مهم!** وابسته‌های دیتابیس Turso داخلش است (`@libsql/client`، `@prisma/adapter-libsql`)
۵. پیام کامیت: `APK v1.1.4: real Vercel URL + device-ID copy + referral 200 + wheel cap 300 + server repair (CORS/Turso)`
۶. **Commit changes** — تمام!

> آپلود دوبارهٔ فایل‌های مشترک با پکیج‌های قبلی بی‌ضرر است (همان محتوای فعلی‌اند).

## گام ۲ — متغیرهای محیطی ورسل (بعد از آپلود؛ حتماً!)

داشبورد ورسل → پروژهٔ بازی → **Settings → Environment Variables** → این سه را بساز/چک کن:

| نام متغیر | مقدار | از کجا؟ |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://….turso.io` | پنل [Turso](https://app.turso.tech) → دیتابیس تو → دکمهٔ **Connect** (URL) |
| `TURSO_AUTH_TOKEN` | توکن بلند JWT | همان‌جا → تب **Tokens** → `turso db tokens create` یا Generate |
| `ADMIN_KEY` | رمز دلخواه پنل مدیریت | همان که قبلاً گذاشتی — نام باید دقیقاً همین باشد |

نکته: `Environment` روی **All** یا حداقل **Production** باشد.

## گام ۳ — Redeploy و تست

۱. تب **Deployments** → روی آخرین دپلوی سه‌نقطهٔ ⋯ → **Redeploy** → تأیید.
۲. بعد از پایان بیلد، در مرورگر این دو را باز کن:
   - `https://colormonor.vercel.app/api/leaderboard` ← باید بگوید `"ok":true`
   - `https://colormonor.vercel.app/api/player/referral?deviceId=cm-test-123456` ← باید `"ok":true` و یک کد معرفی بدهد
۳. اگر `"ok":true` شد یعنی سرور سالم است — در APK هم «معرفی دوستان» و «جدول رقابت» وصل می‌شوند.

---

## این ۳۴ فایل چه هستند؟

### ستون فقرات سرور (جدید در پکیج — بدون این‌ها APK به سرور وصل نمی‌شود) ⭐
| فایل | نقش |
|---|---|
| ⭐ `src/middleware.ts` | **هدرهای CORS** برای همهٔ `/api/*` — بدون آن مرورگرِ داخل APK هر پاسخی را بلاک می‌کند |
| ⭐ `src/lib/db.ts` | لایهٔ دیتابیس دورکشی Turso روی ورسل + ساخت خودکار جداول در اولین اجرا |
| ⭐ `src/lib/schema-ddl.ts` | دستورهای ساخت جدول‌های Player/Grant (idempotent) |
| ⭐ `src/lib/referral.ts` | **پاداش معرفی = ۲۰۰ سکه** برای هر دو طرف |
| ⭐ `src/app/api/route.ts` + ۹ فایل `route.ts` دیگر (`leaderboard`، `player/{sync,claim,referral}`، `admin/{auth,players,player,grant,grant-all}`) | نسخهٔ به‌روز همهٔ سرویس‌های آنلاین |
| ⭐ `package.json` | وابسته‌های Turso برای بیلد ورسل |

### بازی (تغییرهای ۱.۱٫۴)
| فایل | تغییر |
|---|---|
| `src/components/game/LuckyWheel.tsx` | خانهٔ ۵۰۰ → **۲۵۰**؛ بیشترین جایزهٔ گردونه = ۳۰۰ |
| `src/components/game/ReferralModal.tsx` | پاداش نمایشی ۲۰۰ |
| `src/components/game/SettingsModal.tsx` | **دکمهٔ کپی 📋 کنار شناسهٔ دستگاه** (+ کارت سرور آنلاین از ۱.۱٫۳) |
| `src/game/i18n.ts` | متن‌های ۲۰۰ سکه + «کپی شناسه» + «شناسه کپی شد» |
| `src/app/admin/page.tsx` | از ۱.۱٫۳: بدون نمایش رمز پیش‌فرض + پیام اتصال؛ **جدید در ۱.۱٫۴: دکمهٔ کپی 📋 کنار شناسهٔ دستگاه در جدول بازیکن‌ها و در نتیجهٔ جستجو** |
| `src/game/api-base.ts`, `src/game/net.ts` | از ۱.۱٫۳: آدرس سرور قابل تغییر در زمان اجرا |

### پوستهٔ اندروید (همان ۱.۱٫۲/۱.۱٫۳ + شمارهٔ نسخهٔ جدید)
| فایل | توضیح |
|---|---|
| `android/AndroidManifest.xml` | نسخهٔ **۱.۱٫۴ (code 6)**، مجوز پرداخت بازار، `<queries>` |
| `android/java/com/milad1711/colormanor/MainActivity.java` | assets با پیشوند `www/` + fallback سه‌لایه + بدون popup + پرداخت IAB v3 |
| `android/aidl/…` (۲ فایل) | رابط پرداخت بازار |
| `scripts/build-apk.sh` | **API_BASE پیش‌فرض = `https://colormonor.vercel.app`** + چک‌های خودکار |
| `scripts/servetest/ServeTest.java` | تست آفلاین assets |
| `src/lib/admin.ts`, `src/lib/bazaar.ts`, `src/components/game/{CoinPacks,MainMenu}.tsx`, `src/app/page.tsx` | از نسخه‌های قبل (همگام‌سازی) |
| `.gitignore`, `README-APK-FA.md` | راهنما و پاک‌سازی بیلد |

---

## نصب APK و انتشار

- فایل APK در این پکیج **نیست**؛ فایل جداگانهٔ `color-manor-1.1.4.apk` را نصب کن
  (کد قبل → روی آن بزن → نصب. نسخهٔ قبلی را حذف نکن؛ پیشرفت حفظ می‌شود).
- برای انتشار در بازار: پنل بازار → آپلود `color-manor-1.1.4.apk`.
- در صفحهٔ ریپو → **Releases → Draft a new release** → تگ `v1.1.4` → APK را Attach کن → Publish.
- نسخهٔ نصب‌شده: تنظیمات گوشی → برنامه‌ها → عمارت رنگین → **1.1.4**.
- شناسهٔ محصولات بازار: `coin_pack_small` (۱۲۰۰/۵۷٬۰۰۰)، `coin_pack_medium` (۲۹۰۰/۱۲۹٬۰۰۰)، `coin_pack_golden` (۶۸۰۰/۲۷۱٬۰۰۰).
