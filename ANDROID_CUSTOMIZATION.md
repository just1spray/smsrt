# دليل تخصيص تطبيق Android

هذا الدليل يشرح كيفية تخصيص تطبيق Android الذي تم إنشاؤه باستخدام Capacitor من تطبيق React الأصلي "مساعد الملاحظات الذكي".

## الخطوة 1: فتح مشروع Android

بعد تنفيذ الخطوات الأساسية لإضافة منصة Android باستخدام Capacitor، يمكنك فتح مشروع Android في Android Studio:

```bash
npm run cap:open
```

أو

```bash
npx cap open android
```

## الخطوة 2: تخصيص أيقونة التطبيق

1. قم بإنشاء أيقونات بأحجام مختلفة للتطبيق. يمكنك استخدام أدوات مثل [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) لإنشاء أيقونات بالأحجام المطلوبة.

2. استبدل الأيقونات الافتراضية في المجلدات التالية:
   - `android/app/src/main/res/mipmap-hdpi`
   - `android/app/src/main/res/mipmap-mdpi`
   - `android/app/src/main/res/mipmap-xhdpi`
   - `android/app/src/main/res/mipmap-xxhdpi`
   - `android/app/src/main/res/mipmap-xxxhdpi`

3. تأكد من استبدال جميع الملفات في كل مجلد:
   - `ic_launcher.png`
   - `ic_launcher_foreground.png`
   - `ic_launcher_round.png`

## الخطوة 3: تخصيص شاشة البداية (Splash Screen)

1. قم بتثبيت حزمة Splash Screen إذا لم تكن قد قمت بذلك بالفعل:

```bash
npm install @capacitor/splash-screen
```

2. قم بتحديث ملف `capacitor.config.json` لتخصيص إعدادات شاشة البداية:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "backgroundColor": "#ffffffff",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": true,
      "androidSpinnerStyle": "large",
      "spinnerColor": "#3b82f6"
    }
  }
}
```

3. قم بإنشاء صورة شاشة البداية وضعها في المجلد `android/app/src/main/res/drawable` باسم `splash.png`.

## الخطوة 4: تعديل اسم التطبيق وتفاصيل أخرى

1. افتح ملف `android/app/src/main/res/values/strings.xml` وقم بتعديل اسم التطبيق:

```xml
<resources>
    <string name="app_name">مساعد الملاحظات الذكي</string>
    <string name="title_activity_main">مساعد الملاحظات الذكي</string>
    <string name="package_name">com.smartnotesassistant.app</string>
    <string name="custom_url_scheme">com.smartnotesassistant.app</string>
</resources>
```

2. للدعم الكامل للغة العربية، قم بإنشاء ملف `android/app/src/main/res/values-ar/strings.xml`:

```xml
<resources>
    <string name="app_name">مساعد الملاحظات الذكي</string>
    <string name="title_activity_main">مساعد الملاحظات الذكي</string>
    <string name="package_name">com.smartnotesassistant.app</string>
    <string name="custom_url_scheme">com.smartnotesassistant.app</string>
</resources>
```

## الخطوة 5: تعديل ملف AndroidManifest.xml

1. افتح ملف `android/app/src/main/AndroidManifest.xml` وقم بإضافة الأذونات المطلوبة للتطبيق:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- الأذونات الأساسية -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- أذونات إضافية حسب احتياجات التطبيق -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <!-- باقي محتوى الملف -->
        
    </application>
</manifest>
```

## الخطوة 6: تخصيص الألوان والسمات

1. افتح ملف `android/app/src/main/res/values/colors.xml` وقم بتعديل الألوان حسب هوية التطبيق:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#3b82f6</color>
    <color name="colorPrimaryDark">#1d4ed8</color>
    <color name="colorAccent">#60a5fa</color>
</resources>
```

2. يمكنك أيضًا تعديل ملف `android/app/src/main/res/values/styles.xml` لتخصيص سمة التطبيق:

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
    
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
    </style>
</resources>
```

## الخطوة 7: إضافة دعم اللغة العربية والاتجاه من اليمين إلى اليسار (RTL)

1. تأكد من أن ملف `AndroidManifest.xml` يحتوي على `android:supportsRtl="true"` في عنصر `<application>`.

2. في كود React الخاص بك، تأكد من استخدام الاتجاه المناسب في CSS أو في مكونات React.

3. يمكنك إضافة ملفات ترجمة إضافية في مجلدات `values-XX` حسب اللغات التي تريد دعمها.

## الخطوة 8: تعديل إعدادات البناء

1. افتح ملف `android/app/build.gradle` لتعديل إعدادات البناء:

```gradle
android {
    defaultConfig {
        applicationId "com.smartnotesassistant.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // لدعم اللغة العربية
            cruncherEnabled = false
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

2. عند إصدار تحديثات للتطبيق، تأكد من زيادة `versionCode` و`versionName` في هذا الملف.

## الخطوة 9: إضافة خدمات Google (اختياري)

إذا كنت تريد استخدام خدمات Google مثل Firebase أو Google Analytics:

1. قم بإنشاء مشروع في [Firebase Console](https://console.firebase.google.com/)

2. أضف تطبيق Android إلى المشروع باستخدام معرف الحزمة الخاص بك (`com.smartnotesassistant.app`)

3. قم بتنزيل ملف `google-services.json` وضعه في مجلد `android/app`

4. قم بتعديل ملف `android/build.gradle` لإضافة تبعية Google Services:

```gradle
buildscript {
    repositories {
        google()
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:4.2.1'
        classpath 'com.google.gms:google-services:4.3.10' // أضف هذا السطر
    }
}
```

5. قم بتعديل ملف `android/app/build.gradle` لتطبيق البلاجن:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // أضف هذا السطر
```

## الخطوة 10: اختبار التطبيق

1. قم ببناء التطبيق وتشغيله على جهاز أو محاكي:

```bash
npm run android:build
npx cap run android
```

2. اختبر جميع وظائف التطبيق للتأكد من أنها تعمل بشكل صحيح على نظام Android.

3. تأكد من اختبار التطبيق على أجهزة مختلفة وإصدارات مختلفة من Android للتأكد من التوافق.

## الخطوة 11: إنشاء نسخة الإصدار

1. في Android Studio، اختر `Build > Generate Signed Bundle/APK`

2. اتبع الخطوات لإنشاء ملف keystore وتوقيع التطبيق

3. اختر `Android App Bundle (AAB)` للنشر على Google Play

4. اختر `release` كنوع البناء

5. انتظر حتى يكتمل البناء وسيتم إنشاء ملف AAB في المجلد المحدد

## نصائح إضافية

1. **التعامل مع الأذونات**: تأكد من طلب الأذونات بشكل صحيح في وقت التشغيل باستخدام واجهة برمجة تطبيقات Capacitor.

2. **تحسين الأداء**: قم بتحسين أداء التطبيق عن طريق تقليل حجم الحزمة وتحسين وقت التحميل.

3. **التوافق مع الأجهزة**: اختبر التطبيق على مجموعة متنوعة من الأجهزة للتأكد من التوافق.

4. **الأمان**: تأكد من تنفيذ ممارسات الأمان المناسبة، خاصة إذا كان التطبيق يتعامل مع بيانات المستخدم.

5. **تحسين تجربة المستخدم**: تأكد من أن التطبيق يتبع إرشادات تصميم Material Design لتوفير تجربة مستخدم متسقة.

## الموارد المفيدة

- [توثيق Capacitor الرسمي](https://capacitorjs.com/docs)
- [إرشادات تصميم Material Design](https://material.io/design)
- [أفضل ممارسات أداء تطبيقات Android](https://developer.android.com/topic/performance)
- [دليل توقيع تطبيقات Android](https://developer.android.com/studio/publish/app-signing)