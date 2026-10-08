# OTS Mobil Uygulama

Öğrenci takip sistemi için React Native (Expo) istemcisi. Backend'deki `/api/students` endpoint'lerine bağlanır.

## Teknolojiler

- Expo SDK 57, React Native 0.86, React 19
- TypeScript
- Ek kütüphane yok: `fetch`, `FlatList` ve `TextInput` gibi çekirdek React Native API'leri kullanıldı

## Klasör yapısı

```
mobile\
├─ .env           EXPO_PUBLIC_API_URL=http://192.168.1.103:5069
├─ App.tsx        Öğrenci listesi, ekleme formu, silme, yenileme
├─ src\api.ts     API istemcisi (getStudents, createStudent, deleteStudent)
├─ index.ts, app.json, package.json, tsconfig.json
└─ AGENTS.md      Expo şablonunun geldiği yönergeler
```

## Ekran özellikleri

- Öğrenci listesi (aşağı çekerek yenileme)
- Ad, soyad ve sınıf (1-12) ile öğrenci ekleme
- Silmeden önce onay penceresi
- Yükleniyor, hata ("Tekrar dene" düğmesi) ve boş liste durumları
- Backend'in döndürdüğü doğrulama hataları uyarı penceresinde gösterilir

## API adresi

Adres `.env` dosyasındaki `EXPO_PUBLIC_API_URL` değerinden okunur. Tanımlı değilse `http://localhost:5069` kullanılır.

| Ortam | Adres |
|---|---|
| Fiziksel telefon (aynı Wi-Fi) | `http://<bilgisayarın IPv4 adresi>:5069` (şu an `192.168.1.103`) |
| Android emülatörü | `http://10.0.2.2:5069` |

IP adresi değişirse `ipconfig` ile yeni adresi öğrenin, `.env` dosyasını güncelleyin ve `npx expo start -c` ile yeniden başlatın.

## Telefonda çalıştırma

1. Telefona **Expo Go** kurun (Play Store / App Store). Telefon ve bilgisayar aynı Wi-Fi ağında olmalı.
2. Windows Güvenlik Duvarı'nda 5069 portuna izin verin (ayrıntı `backend\README.md` içinde).
3. Üç şeyi başlatın:

```powershell
# 1) Veritabanı (çalışmıyorsa)
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D C:\pgdata -l C:\pgdata\server.log start

# 2) API
cd C:\OnurY\OTS\backend\OtsApi
dotnet run --launch-profile lan

# 3) Mobil
cd C:\OnurY\OTS\mobile
npx expo start
```

4. Android'de Expo Go içinden "Scan QR code" ile, iPhone'da Kamera uygulamasıyla QR kodu okutun.

Uygulamayı açmadan önce telefonun tarayıcısında `http://192.168.1.103:5069/api/students` adresini deneyin. Liste ya da `[]` görünüyorsa ağ ayarları doğrudur.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| "Network request failed" | Tarayıcı testi açılmıyorsa güvenlik duvarı kuralını ve Wi-Fi'yi kontrol edin |
| QR okununca Expo Go bağlanamıyor | `npx expo start --tunnel` deneyin |
| IP adresi değişti | `.env` dosyasını güncelleyip `npx expo start -c` çalıştırın |
| Bilgisayar yeniden başladı | Önce PostgreSQL'i başlatın |

## Doğrulama durumu

- `npx tsc --noEmit`: hatasız
- `npx expo export --platform android`: paket başarıyla oluşturuldu
- Gerçek telefonda veya emülatörde henüz denenmedi

## Yapılanlar

1. `create-expo-app` ile `blank-typescript` şablonundan proje oluşturuldu, bağımlılıklar kuruldu.
2. `src/api.ts` ile API istemcisi yazıldı.
3. `App.tsx` ile öğrenci listeleme, ekleme ve silme ekranı yazıldı.
4. `.env` ile API adresi yapılandırıldı.

## Sonraki adımlar

- Course, Topic ve Progress için ekranlar (ders takibi)
- Öğrenci düzenleme ekranı
- Çok ekranlı gezinme için Expo Router
