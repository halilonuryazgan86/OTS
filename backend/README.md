# OTS Backend

Öğrenci takip sistemi için ASP.NET Core minimal API. Bağımsız özel ders öğretmenleri öğrencilerini, derslerini ve konu bazında ilerlemeyi yönetir; veliler yalnızca kendi çocuklarını görür ve yorum yazar.

Tek API projesi, tek veritabanı. Clean Architecture, CQRS, MediatR, Repository / Unit of Work veya mikroservis yok; endpoint'ler doğrudan `AppDbContext` kullanır.

## Teknolojiler

- .NET 10, ASP.NET Core minimal API
- Entity Framework Core 10 + Npgsql EF Core provider
- PostgreSQL 16 (Laragon içinde)
- JWT kimlik doğrulama (`Microsoft.AspNetCore.Authentication.JwtBearer`), şifre hash'i için ASP.NET Core'un `PasswordHasher`'ı

## Klasör yapısı

```
backend\
├─ Ots.sln
├─ api-tests.http                    VS Code REST Client ile örnek istekler
└─ OtsApi\
   ├─ Models\                        User, Student, Course, Topic, Progress, ProgressComment
   ├─ Data\
   │  ├─ AppDbContext.cs             tablo ayarları, ilişkiler, index'ler
   │  └─ DevSeed.cs                  yalnızca Development: demo öğretmen hesabı
   ├─ Endpoints\
   │  ├─ AuthEndpoints.cs            giriş, kayıt, şifre değiştirme, kilit
   │  ├─ StudentEndpoints.cs         öğrenciler ve veli hesapları
   │  ├─ CourseEndpoints.cs          dersler ve konular
   │  ├─ ProgressEndpoints.cs        ilerleme ve konu yorumları
   │  ├─ DashboardEndpoints.cs       öğretmen ana sayfası, veli çocukları ve akışı
   │  └─ ReportEndpoints.cs          başarı raporu
   ├─ Migrations\
   ├─ Properties\launchSettings.json http, lan, https profilleri
   ├─ appsettings.json               JWT ayarları (anahtar hariç)
   ├─ appsettings.Development.json   bağlantı dizesi, JWT anahtarı, demo öğretmen
   └─ Program.cs                     servisler, yetki kuralları, istek sınırları
```

## Roller ve yetki

| Rol | Nasıl oluşur | Ne yapabilir |
|---|---|---|
| Öğretmen | Kendi kaydını açar (`/api/auth/register`) | Yalnızca **kendi** öğrencileri, dersleri, konuları; ilerleme günceller, veli hesabı açar, yorum yazar, rapor görür |
| Veli | Öğretmen açar (geçici şifreyle) | Yalnızca **kendi çocuklarını** görür, konulara yorum yazar; hiçbir kaydı değiştiremez |

- Her öğretmen bağımsızdır (okul/kurum kavramı yok). Başka öğretmenin kaydı istenirse **404** döner (kaydın varlığı da sızdırılmaz).
- Bir velinin birden çok çocuğu, bir öğrencinin birden çok velisi olabilir (anne ve baba ayrı hesap). Kardeşe veli eklerken aynı e-posta girilirse yeni hesap açılmaz, mevcut hesap bağlanır.
- Yetki kontrolü sunucudadır; mobil uygulama yalnızca doğru ekranları gösterir.

## Güvenlik

- **Şifre kuralı:** 8–100 karakter, en az bir harf ve bir rakam. Şifreler hash'lenerek saklanır.
- **Zorunlu şifre değiştirme:** öğretmenin açtığı veli hesabı geçici şifreyle başlar; öğretmen veli şifresini yenilediğinde de aynısı geçerlidir. Bu durumda token yalnızca `/api/auth/me` ve `/api/auth/password`'e erişebilir; şifre değişince yeni token döner.
- **Hatalı giriş kilidi:** üst üste 5 hatalı denemede hesap **15 dakika** kilitlenir (423). 3. hatadan sonra kalan hak mesajda yazar. Kilitliyken doğru şifre de kabul edilmez; öğretmen veli şifresini yenileyince kilit kalkar.
- **İstek sınırı (IP başına):** giriş dakikada 5, kayıt 10 dakikada 5 deneme (429).
- **Rol sabit:** kayıt her zaman öğretmen hesabı açar; istekte gönderilen rol yok sayılır.
- **Hata yanıtları:** tümü ProblemDetails (JSON). Okunamayan gövde (bozuk JSON) 400 döner, beklenmeyen hata 500.
- Girdi doğrulama tüm uç noktalarda; mesajlar Türkçe.

## Veri modeli

| Tablo | Alanlar |
|---|---|
| Users | Id, FullName, Email (benzersiz), PasswordHash, Role (Teacher / Parent), CreatedAt, MustChangePassword, FailedLoginCount, LockoutEnd? |
| Students | Id, FirstName, LastName, Email?, GradeLevel (1–12), CreatedAt, TeacherId? |
| StudentParents | öğrenci ↔ veli ara tablosu |
| Courses | Id, Name, TeacherId? |
| Topics | Id, CourseId, Name, Order |
| Progresses | Id, StudentId, TopicId, Status, StatusDate?, CompletedAt?, UpdatedAt |
| ProgressComments | Id, StudentId, TopicId, AuthorId, Text (≤1000), CreatedAt |

- `Progresses`: (StudentId, TopicId) benzersiz. `Status` metin olarak saklanır: NotStarted / InProgress / Completed.
- `StatusDate`: öğretmenin girdiği işlem tarihi-saati (Başlamadı'da boş). `UpdatedAt`: kaydın sisteme yazıldığı an ("son güncellemeler" sıralaması).
- Ders silinince konuları, konu ya da öğrenci silinince ilerleme ve yorumları da silinir (cascade).
- Performans için index'ler: öğretmen sahipliği, `Progresses.UpdatedAt`, yorumlarda (StudentId, TopicId, CreatedAt) ve `CreatedAt`.

## Endpoint'ler

Tüm istekler (giriş ve kayıt hariç) `Authorization: Bearer <token>` ister.

**Oturum**

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/register` | Öğretmen kaydı, token döner |
| POST | `/api/auth/login` | Giriş, token döner (401 / 423 / 429) |
| GET | `/api/auth/me` | Oturum bilgisi |
| PUT | `/api/auth/password` | Şifre değiştir, yeni token döner |

**Öğretmen**

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/dashboard` | Sayılar + son durum değişiklikleri ve veli yorumları |
| GET | `/api/reports/summary` | Başarı raporu: durum dağılımı, son 8 hafta, ders / sınıf / öğrenci bazında |
| GET, POST | `/api/students` | Öğrenciler (tamamlanan / toplam konu ile) |
| GET, PUT, DELETE | `/api/students/{id}` | Öğrenci detayı (veliler dahil) |
| POST | `/api/students/{id}/parents` | Veli hesabı aç ya da mevcut veliyi bağla (`linkedExisting`) |
| DELETE | `/api/students/{id}/parents/{parentId}` | Veliyi öğrenciden kaldır |
| PUT | `/api/students/{id}/parents/{parentId}/password` | Veli şifresini yenile (geçici şifre, kilit kalkar) |
| GET, POST | `/api/courses` | Dersler (konularla) |
| GET, PUT, DELETE | `/api/courses/{id}` | Ders |
| POST | `/api/courses/{id}/topics` | Konu ekle |
| PUT, DELETE | `/api/topics/{id}` | Konu düzenle / sil (sıra dahil) |
| PUT | `/api/students/{id}/progress/{topicId}` | Durum + tarih-saat (`{ status, date? }`; ileri tarih 400) |

**Öğretmen ve veli**

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/students/{id}/progress` | Konu bazında durum, tarih, yorum sayısı ve son yorum |
| GET, POST | `/api/students/{id}/topics/{topicId}/comments` | Konu yorumları |
| DELETE | `/api/comments/{id}` | Yorumu yalnızca yazan siler |

**Veli**

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/my/children` | Çocuklar (öğretmen adı, ilerleme) |
| GET | `/api/my/activity` | Son durum değişiklikleri ve öğretmen yorumları |

Örnek istekler: `api-tests.http`.

## Ayarlar

| Ayar | Yer | Not |
|---|---|---|
| `ConnectionStrings:Default` | appsettings.Development.json | `postgres` / `OtsDev123!`, veritabanı `ots` |
| `Jwt:Issuer`, `Jwt:Audience`, `Jwt:ExpiresHours` | appsettings.json | token 12 saat geçerli |
| `Jwt:Key` | appsettings.Development.json | en az 32 byte; yoksa uygulama açılmaz |
| `Seed:Teachers` | appsettings.Development.json | yalnızca Development'ta oluşturulur |

**Demo öğretmen (yalnızca geliştirme):** `ogretmen@ots.local` / `Ogretmen123!`

Geliştirme şifreleri ve JWT anahtarı açık metindir. Canlı ortamda `dotnet user-secrets` veya ortam değişkeniyle verilmeli; `Seed` kullanılmamalıdır.

## PostgreSQL (Laragon)

PostgreSQL 16, Laragon'a eklendi:

- Program: `C:\laragon\bin\postgresql\postgresql-16`
- Veri: `C:\laragon\data\postgresql-16`
- Kullanıcı `postgres`, şifre `OtsDev123!`, port `5432`

Laragon'da **Start All** ile başlar. HeidiSQL ile bağlanmak için ağ türü "PostgreSQL (TCP/IP)", kütüphane `libpq-15.dll`.

## Çalıştırma

En kolayı proje kökündeki betikler (ayrıntı: `mobile\README.md`):

```powershell
cd C:\Yazgan\OTS\OTS
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1   # PostgreSQL + API + Expo
powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1    # API + Expo'yu durdurur
```

Yalnızca API:

```powershell
cd C:\Yazgan\OTS\OTS\backend\OtsApi
dotnet run --launch-profile http   # yalnızca bu bilgisayar: http://localhost:5069
dotnet run --launch-profile lan    # telefondan erişim: http://0.0.0.0:5069
```

Telefondan erişimde Wi-Fi ağı Windows'ta **Özel ağ** olmalı ya da güvenlik duvarında 5069'a izin verilmeli.

## Migration'lar

| Migration | İçerik |
|---|---|
| InitialCreate | Students, Courses, Topics, Progresses |
| AddUsersAndRoles | Users, StudentParents, öğretmen sahipliği, `Progresses.UpdatedAt` |
| AddLoginSecurity | zorunlu şifre değiştirme, hatalı giriş sayacı, kilit |
| AddProgressUpdatedAtIndex | son güncellemeler için index |
| ProgressCommentsAndStatusDate | yorum tablosu, `StatusDate`; eski `Note` değerleri yorumlara taşındı, ardından kolon kaldırıldı |

```powershell
cd C:\Yazgan\OTS\OTS\backend\OtsApi
dotnet ef migrations add <Ad>      # API çalışıyorsa önce durdurun (derlenen dosya kilitlenir)
dotnet ef database update
```

`--no-build` kullanmayın: eski derlemeyi okur ve boş migration üretir.

## Test ve performans

- Tüm uç noktalar gerçek veritabanında `curl` ile test edildi: yetki ayrımı (öğretmenler arası 404, veli 403), veli bağlama, zorunlu şifre değiştirme, kilit ve istek sınırları, yorumlar, tarih doğrulaması, rapor.
- Yük testi (500 öğrenci, 500 konu, ~150.000 ilerleme kaydı): ilerleme 15 ms, öğrenci listesi ~80 ms, ana sayfa ~80–120 ms, rapor ~530 ms. Gerçekçi bir özel ders verisinde (ör. 30 öğrenci × 100 konu) hepsi onlarca milisaniye düzeyindedir.
- Windows terminalinden `curl` ile Türkçe karakterli istek gönderirken gövdeyi UTF-8 dosyadan verin (`--data-binary @dosya.json`); aksi halde 400 alınır.

## Yapılanlar

1. Öğrenci CRUD'una ek olarak ders, konu ve ilerleme uç noktaları.
2. Genel hata yönetimi (ProblemDetails), doğrulama ve uzunluk sınırları.
3. Öğretmen / veli rolleri, JWT, öğretmen bazında veri ayrımı, veli–öğrenci çoka çok ilişkisi.
4. Öğretmenin kendi kaydı, güçlü şifre kuralı, zorunlu şifre değiştirme, hatalı giriş kilidi, istek sınırları.
5. Öğretmen ana sayfası ve veli akışı, başarı raporu.
6. Konu yorumları (öğretmen ve veli), öğretmenin girdiği işlem tarihi-saati.
7. Büyük veriyle ölçüm ve index optimizasyonu.
8. PostgreSQL 16 Laragon'a taşındı; eski `bin/obj` derleme çıktıları git takibinden çıkarıldı.

## Sonraki adımlar

- Canlı ortam: gizli bilgileri `user-secrets` / ortam değişkenine taşımak, HTTPS.
- "Şifremi unuttum" (öğretmen için; e-posta gönderimi gerekir).
- Öğrenci sayısı binlerle ifade edilirse sunucu tarafı sayfalama ve arama (Türkçe harf duyarlılığı için ICU collation gerekir).
