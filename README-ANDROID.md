# دليل تحويل تطبيق مساعد الملاحظات الذكي إلى تطبيق Android ونشره على متجر Google Play

هذا الدليل يشرح الخطوات اللازمة لتحويل تطبيق الويب الحالي (React) إلى تطبيق Android باستخدام Capacitor ونشره على متجر Google Play.

## المتطلبات الأساسية

- تثبيت Node.js وNPM على جهازك
- تثبيت Android Studio
- حساب مطور على Google Play (يتطلب دفع رسوم تسجيل لمرة واحدة بقيمة 25 دولار)
- JDK (Java Development Kit) الإصدار 8 أو أعلى

## الخطوة 1: تثبيت Capacitor وإعداده

1. قم بتثبيت Capacitor CLI عالميًا:

```bash
npm install -g @capacitor/cli
```

2. قم بتثبيت حزم Capacitor في مشروعك:

```bash
npm install @capacitor/core @capacitor/android
```

3. قم بإنشاء ملف `capacitor.config.json` في المجلد الرئيسي للمشروع:

```json
{
  "appId": "com.yourname.smartnotesassistant",
  "appName": "مساعد الملاحظات الذكي",
  "bundledWebRuntime": false,
  "npmClient": "npm",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    }
  },
  "cordova": {}
}
```

> ملاحظة: تأكد من تغيير `appId` إلى معرف فريد خاص بك، ويفضل استخدام نمط عكس اسم النطاق (مثل com.yourname.appname).

## الخطوة 2: بناء تطبيق الويب

1. قم ببناء تطبيق الويب الخاص بك:

```bash
npm run build
```

> ملاحظة: تأكد من أن مجلد الإخراج يتطابق مع قيمة `webDir` في ملف `capacitor.config.json`. في حالة Vite، المجلد الافتراضي هو `dist`.

## الخطوة 3: إضافة منصة Android

1. قم بتهيئة Capacitor في مشروعك:

```bash
npx cap init
```

2. أضف منصة Android:

```bash
npx cap add android
```

3. نسخ ملفات البناء إلى مشروع Android:

```bash
npx cap copy android
```

## الخطوة 4: تخصيص تطبيق Android

1. افتح مشروع Android في Android Studio:

```bash
npx cap open android
```

2. قم بتخصيص أيقونة التطبيق:
   - انتقل إلى `android/app/src/main/res`
   - استبدل الصور في مجلدات `mipmap-*` بأيقونات التطبيق الخاصة بك بأحجام مختلفة

3. قم بتخصيص شاشة البداية (Splash Screen):
   - قم بتثبيت حزمة Splash Screen:
   ```bash
   npm install @capacitor/splash-screen
   ```
   - قم بتخصيص الصور في `android/app/src/main/res/drawable`

4. تحديث معلومات التطبيق في `android/app/src/main/AndroidManifest.xml`

## الخطوة 5: إنشاء حزمة APK/AAB للنشر

1. في Android Studio، اختر `Build > Generate Signed Bundle/APK`

2. اختر `Android App Bundle` أو `APK` (يفضل استخدام AAB للنشر على Google Play)

3. إنشاء مفتاح التوقيع (Keystore):
   - انقر على `Create new...`
   - املأ المعلومات المطلوبة واحفظ ملف keystore في مكان آمن
   - **هام جدًا**: احتفظ بملف keystore وكلمة المرور في مكان آمن، فقدانها يعني عدم القدرة على تحديث التطبيق مستقبلاً

4. اختر `release` كنوع البناء

5. انتظر حتى يكتمل البناء وسيتم إنشاء ملف AAB/APK في المجلد المحدد

## الخطوة 6: نشر التطبيق على Google Play

1. قم بإنشاء حساب مطور على Google Play (إذا لم يكن لديك واحد بالفعل)

2. ادخل إلى [Google Play Console](https://play.google.com/console/)

3. انقر على `إنشاء تطبيق`

4. أكمل معلومات التطبيق الأساسية:
   - اسم التطبيق
   - وصف قصير ووصف كامل
   - أيقونات وصور العرض
   - تصنيف المحتوى
   - معلومات الاتصال

5. قم بتحميل ملف AAB/APK الذي قمت بإنشائه

6. حدد البلدان التي تريد نشر التطبيق فيها والأسعار (إذا كان التطبيق مدفوعًا)

7. أكمل استبيان تصنيف المحتوى

8. قم بمراجعة جميع المعلومات وإرسال التطبيق للمراجعة

## ملاحظات هامة

- عملية مراجعة Google Play قد تستغرق من عدة ساعات إلى عدة أيام
- تأكد من اتباع [سياسات المطورين](https://play.google.com/about/developer-content-policy/) الخاصة بـ Google Play
- قم بإجراء اختبار شامل للتطبيق على أجهزة مختلفة قبل النشر
- تأكد من أن التطبيق يعمل بشكل صحيح في وضع عدم الاتصال بالإنترنت إذا كان ذلك مناسبًا

## تحديث التطبيق

عندما تريد تحديث التطبيق، اتبع الخطوات التالية:

1. قم بتحديث كود المصدر وإجراء التغييرات المطلوبة

2. قم ببناء تطبيق الويب مرة أخرى:
```bash
npm run build
```

3. نسخ التحديثات إلى مشروع Android:
```bash
npx cap copy android
```

4. قم بزيادة رقم الإصدار في `android/app/build.gradle`:
   - زيادة `versionCode` (رقم صحيح)
   - تحديث `versionName` (سلسلة نصية مثل "1.0.1")

5. قم بإنشاء حزمة AAB/APK جديدة باستخدام نفس مفتاح التوقيع

6. قم بتحميل الإصدار الجديد على Google Play Console

## الموارد المفيدة

- [توثيق Capacitor الرسمي](https://capacitorjs.com/docs)
- [مركز مطوري Google Play](https://developer.android.com/distribute/console)
- [سياسات مطوري Google Play](https://play.google.com/about/developer-content-policy/)