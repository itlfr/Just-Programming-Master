# دليل النشر على Vercel - Just Programming Blog

## المتطلبات المسبقة

1. **حساب GitHub**: لرفع الكود
2. **حساب Vercel**: للنشر المجاني
3. **قاعدة بيانات MongoDB**: MongoDB Atlas (مجاني)

## خطوات النشر

### 1. إعداد قاعدة البيانات (MongoDB Atlas)

1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/atlas)
2. أنشئ حساب جديد أو سجل الدخول
3. أنشئ Cluster جديد (اختر المجاني M0)
4. أنشئ مستخدم قاعدة بيانات:
   - اذهب إلى Database Access
   - أضف مستخدم جديد مع كلمة مرور قوية
5. اضبط Network Access:
   - اذهب إلى Network Access
   - أضف IP Address: `0.0.0.0/0` (للسماح لجميع الاتصالات)
6. احصل على Connection String:
   - اذهب إلى Clusters → Connect → Connect your application
   - انسخ الرابط وغير `<password>` بكلمة المرور الفعلية

### 2. رفع الكود إلى GitHub

1. أنشئ مستودع جديد على GitHub
2. ارفع جميع ملفات المشروع:

\`\`\`bash
git init
git add .
git commit -m "Initial commit: Just Programming Blog"
git branch -M main
git remote add origin https://github.com/username/just-programming-blog.git
git push -u origin main
\`\`\`

### 3. النشر على Vercel

1. اذهب إلى [Vercel](https://vercel.com)
2. سجل الدخول باستخدام GitHub
3. اضغط "New Project"
4. اختر مستودع `just-programming-blog`
5. اضغط "Deploy"

### 4. إعداد متغيرات البيئة

بعد النشر الأولي، اذهب إلى إعدادات المشروع في Vercel:

1. اذهب إلى Project Settings → Environment Variables
2. أضف المتغيرات التالية:

| المتغير | القيمة | الوصف |
|---------|--------|--------|
| `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/justprogramming` | رابط قاعدة البيانات |
| `ADMIN_PASSWORD` | `your_secure_password` | كلمة مرور الإدارة |
| `SESSION_SECRET` | `your_random_secret_key` | مفتاح الجلسة (32 حرف عشوائي) |

### 5. إعادة النشر

بعد إضافة متغيرات البيئة:
1. اذهب إلى Deployments
2. اضغط على النشر الأخير
3. اضغط "Redeploy"

## الوصول للموقع

- **الصفحة الرئيسية**: `https://your-project.vercel.app`
- **لوحة الإدارة**: `https://your-project.vercel.app/admin.html`

## نصائح مهمة

### الأمان
- استخدم كلمة مرور قوية للإدارة (12+ حرف)
- غير `SESSION_SECRET` إلى مفتاح عشوائي قوي
- لا تشارك متغيرات البيئة مع أحد

### الأداء
- الصور والفيديوهات محدودة بـ 50 ميجابايت
- استخدم صور مضغوطة لتحسين السرعة
- MongoDB Atlas المجاني يدعم 512 ميجابايت تخزين

### الصيانة
- راقب استخدام قاعدة البيانات من MongoDB Atlas
- احتفظ بنسخة احتياطية من المحتوى
- تحديث كلمة مرور الإدارة دورياً

## استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
- تأكد من صحة `MONGODB_URI`
- تأكد من إعدادات Network Access في MongoDB Atlas

### خطأ في تسجيل الدخول
- تأكد من صحة `ADMIN_PASSWORD`
- امسح cookies المتصفح وحاول مرة أخرى

### خطأ في رفع الملفات
- تأكد من حجم الملف أقل من 50 ميجابايت
- تأكد من نوع الملف (صورة أو فيديو فقط)

## الدعم

للمساعدة أو الإبلاغ عن مشاكل:
1. تحقق من Vercel Function Logs
2. تحقق من MongoDB Atlas Logs
3. راجع ملف README.md للمزيد من التفاصيل
