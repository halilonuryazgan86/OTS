# OTS Mobil Uygulama

Öğrenci takip sistemi için React Native (Expo) istemcisi. Öğretmen ve veli girişi vardır; her rol yalnızca kendi ekranlarını görür. Backend ayrıntıları: `backend\README.md`.

## Teknolojiler

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript
- Expo Router (dosya tabanlı gezinme)
- State yönetimi: React Hooks (ek kütüphane yok)
- Eklenen paketler ve nedenleri:

| Paket | Neden |
|---|---|
| `expo-router` (+ `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `react-dom`) | Giriş, rol bazlı sekmeler ve detay ekranları |
| `expo-secure-store` | Giriş token'ını telefonda şifreli saklamak |
| `@expo/vector-icons` (+ `expo-font`) | Arayüz ikonları |
| `@react-native-community/datetimepicker` | Öğretmenin tarih-saat seçmesi |

Hepsi Expo Go'da çalışır; ayrı derleme gerekmez.

## Klasör yapısı

```
mobile\
├─ .env                     EXPO_PUBLIC_API_URL=http://<bilgisayar IP>:5069 (start-dev.ps1 günceller)
├─ app.json, package.json   "main": "expo-router/entry"
└─ src\
   ├─ app\                  yalnızca yönlendirme dosyaları (ekranları src\screens'ten dışa aktarır)
   │  ├─ _layout.tsx        oturum ve rol bazlı erişim (Stack.Protected)
   │  ├─ index.tsx          rolüne göre başlangıç ekranına yönlendirir
   │  ├─ login, register, change-password, report
   │  ├─ (teacher)\         sekmeler: home, students, courses, profile
   │  ├─ (parent)\          sekmeler: children, updates, account
   │  └─ student\[id], course\[id], child\[id]
   ├─ screens\              ekranlar (teacher\, parent\, ortak giriş / profil)
   ├─ components\           küçük, tekrar kullanılan parçalar + theme.ts
   ├─ services\             api.ts, auth.tsx (oturum), useApi.ts, validation.ts
   └─ types\                user, student, course
```

## Ekranlar

**Ortak**
- Giriş: hatalı denemede kalan hak uyarısı, kilit mesajı.
- Öğretmen kaydı: şifre kuralları yazarken canlı işaretlenir.
- Zorunlu şifre değiştirme: geçici şifreyle giren veli, devam etmeden kendi şifresini belirler.
- Profil: şifre değiştirme, çıkış.

**Öğretmen**
- **Ana Sayfa:** öğrenci / ders / konu sayıları ve genel başarı (kartlar tıklanabilir), son durum değişiklikleri ve veli yorumları (öğrenciye gider).
- **Başarı Raporu:** genel oran ve durum dağılımı, son 8 haftada tamamlanan konular (çubuğa dokununca değer), ders ve sınıf bazında başarı, en yüksek ilerleme ve desteğe ihtiyaç duyabilecek öğrenciler.
- **Öğrenciler:** arama (Türkçe harf duyarsız), sınıf filtresi, ilerleme çubuğu, ekleme.
- **Öğrenci detayı:** düzenle / sil, veliler (yeni veli veya kayıtlı veliyi kardeşe bağlama, kaldırma, şifre yenileme), ders bazında ilerleme.
- **Konu penceresi:** durum seçimi, durum "Devam ediyor" veya "Tamamlandı" iken **tarih ve saat**, altında veliyle **yorum akışı**.
- **Dersler / ders detayı:** ders ekle, yeniden adlandır, sil; konu ekle, düzenle (kalem), sil, oklarla sırala.

**Veli**
- **Çocuklarım:** öğretmen adı ve ilerleme.
- **Çocuk detayı:** ders bazında durum ve tarihler (salt okunur); konuya dokununca öğretmenle yorumlaşma.
- **Son Gelişmeler:** öğretmenin durum değişiklikleri ve yorumları (çocuğa gider).

## Tasarım ve performans

- Ortak tema (`components\theme.ts`): renkler, köşe yarıçapları, durum renkleri. Durumlar her zaman ikon + etiketle gösterilir (renk tek başına anlam taşımaz).
- Listeler `FlatList` ile kaydırmalıdır (sayfalama yok): yalnızca görünen satırlar çizilir, satırlar `memo` bileşenlerdir, arama ertelenerek (`useDeferredValue`) uygulanır. 500 öğrencide liste ~80 ms'de gelir.
- 3'ten fazla ders varsa ders kartları kapalı başlar; konular yalnızca açılan kartta çizilir.
- Ekranlar her odaklandığında veriyi sessizce yeniler (`useApi`); detaydan dönünce listeler günceldir.
- Ana sayfa ve konu penceresinde **"Sürüm …"** etiketi vardır (`APP_BUILD`, `theme.ts`). Telefonda güncel kodun çalıştığını buradan doğrulayın; her teslimde artırın.

## Çalıştırma (Expo Go ile telefonda)

Telefon ve bilgisayar aynı Wi-Fi ağında olmalı; telefona **Expo Go** (SDK 58) kurulmalı.

```powershell
cd C:\Yazgan\OTS\OTS
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1          # başlat
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Clear   # Expo önbelleğini temizleyerek
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Tunnel  # QR aynı ağda çalışmazsa
powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1           # API ve Expo'yu durdur
powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1 -StopDb   # PostgreSQL'i de durdur
```

`start-dev.ps1`: PostgreSQL kapalıysa başlatır, bilgisayarın IP'sini bulup `.env`'i günceller (değiştiyse önbelleği temizler), Node.js'i bulur, `node_modules` yoksa kurar, API ve Expo'yu **OTS API** / **OTS Expo** pencerelerinde açar.

`stop-dev.ps1`: bu pencereleri içlerindeki işlemlerle kapatır; elle açılmışsa 5069 / 8081 portlarını dinleyen `dotnet` / `node` işlemlerini durdurur, başka programlara dokunmaz. `-WhatIf` ile neyi durduracağını gösterir.

Telefonda: Expo penceresindeki QR'ı Expo Go ile okutun ya da **Enter URL manually** → `exp://<bilgisayar IP>:8081`.

Elle çalıştırmak isterseniz:

```powershell
cd C:\Yazgan\OTS\OTS\mobile
npx expo start --lan
```

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| Ekranda eski sürüm / yeni özellik yok | "Sürüm" etiketine bakın. Expo Go'yu son uygulamalardan **tamamen kapatıp** açın veya Expo penceresinde `r`'ye basın; olmazsa `start-dev.ps1 -Clear` |
| "Sunucuya ulaşılamadı" | API penceresi açık mı? Telefon tarayıcısında `http://<IP>:5069/api/auth/me` açılmalı (401 normal) |
| Telefon tarayıcısında da açılmıyor | Wi-Fi'yi Windows'ta **Özel ağ** yapın veya güvenlik duvarı izin penceresinde "İzin ver" |
| IP değişti | `start-dev.ps1` otomatik günceller; elle: `.env`'i düzeltip `npx expo start --lan --clear` |
| "Project is incompatible with this version of Expo Go" | Expo Go ve proje SDK'sı aynı olmalı (şu an SDK 58) |
| Yorum gönderilmiyor | API çalışıyor mu kontrol edin; yorum 1–1000 karakter olmalı |

## Doğrulama

- `npx tsc --noEmit`: hatasız
- `npx expo-doctor`: 20/20
- `npx expo export --platform android`: paket oluşuyor
- Backend uç noktaları gerçek veritabanında test edildi. Son eklenen ekranların (rapor, tarih-saat, yorumlar) telefonda denenmesi kullanıcı tarafında bekliyor.

## Yapılanlar

1. Tek dosyalık `App.tsx` ekranı `screens / components / services / types` yapısına bölündü.
2. Expo SDK 57 → 58 yükseltmesi (telefondaki Expo Go SDK 58 olduğu için).
3. Expo Router ile öğretmen / veli rol bazlı gezinme; JWT oturumu ve şifreli token saklama.
4. Yeniden tasarım: tema, kartlar, ikonlar, avatarlar, ilerleme çubukları, alttan açılan formlar.
5. Öğretmen: ana sayfa, öğrenci ve ders yönetimi, veli hesapları, ilerleme takibi.
6. Veli: çocuklar, ilerleme, son gelişmeler.
7. Öğretmen kaydı, zorunlu şifre değiştirme, kilit uyarıları.
8. Başarı raporu, tarih-saat girişi, öğretmen–veli yorum akışı, tıklanabilir ana sayfa.
9. Liste performansı ve büyük veri için çizim optimizasyonları.
10. `start-dev.ps1` / `stop-dev.ps1` betikleri.

## Sonraki adımlar

- Lint kurulumu (`npx expo lint` henüz yapılandırılmadı).
- Yeni yorumlar için bildirim (push notification; Expo Go dışında geliştirme derlemesi gerektirebilir).
- Canlı dağıtım için EAS build.
