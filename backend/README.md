# OTS Backend

Basit öğrenci takip sistemi için ASP.NET Core Web API. Tek backend, tek veritabanı; mikroservis, CQRS, MediatR veya ek abstraction katmanı yok. Endpoint'ler doğrudan `AppDbContext` kullanır.

## Teknolojiler

- .NET 9 (SDK 9.0.318), ASP.NET Core minimal API
- Entity Framework Core 9 + Npgsql
- PostgreSQL 16

## Klasör yapısı

```
backend\
├─ Ots.sln
├─ api-tests.http                  VS Code REST Client ile test istekleri
└─ OtsApi\
   ├─ Models\                      Student, Course, Topic, Progress
   ├─ Data\AppDbContext.cs
   ├─ Endpoints\StudentEndpoints.cs
   ├─ Migrations\                  InitialCreate
   ├─ Properties\launchSettings.json   http, lan, https profilleri
   ├─ appsettings.Development.json     bağlantı dizesi
   └─ Program.cs
```

## Veri modeli

| Tablo | Alanlar |
|---|---|
| Students | Id, FirstName, LastName, Email?, GradeLevel, CreatedAt |
| Courses | Id, Name |
| Topics | Id, CourseId, Name, Order |
| Progresses | Id, StudentId, TopicId, Status (NotStarted / InProgress / Completed), CompletedAt?, Note? |

`Progresses` tablosunda (StudentId, TopicId) çifti benzersizdir. Durum değeri veritabanında metin olarak saklanır.

## Öğrenci endpoint'leri

| Metot | Yol | Sonuç |
|---|---|---|
| GET | `/api/students` | 200, liste |
| GET | `/api/students/{id}` | 200 veya 404 |
| POST | `/api/students` | 201 veya 400 |
| PUT | `/api/students/{id}` | 200, 400 veya 404 |
| DELETE | `/api/students/{id}` | 204 veya 404 |

İstek gövdesi: `{ "firstName", "lastName", "email", "gradeLevel" }`

Doğrulama kuralları: ad ve soyad zorunlu, sınıf 1 ile 12 arasında, e-posta varsa `@` içermeli. Hatalar 400 ve Türkçe mesajlarla döner.

## PostgreSQL kurulumu

Kurulum paketi Windows servisini oluşturamadı (kullanıcı adındaki `ü` karakteri nedeniyle olduğu tahmin ediliyor). Bu yüzden veritabanı `C:\pgdata` klasöründe elle başlatılır. **Bilgisayar yeniden başlayınca otomatik açılmaz.**

- Kullanıcı: `postgres`, parola: `OtsDev123!`, port: `5432`, veritabanı: `ots`
- Parola yalnızca geliştirme içindir. Canlı ortamda kullanmayın.

```powershell
# Başlat
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D C:\pgdata -l C:\pgdata\server.log start

# Durdur
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D C:\pgdata stop
```

## Çalıştırma

```powershell
cd C:\OnurY\OTS\backend\OtsApi

dotnet run --launch-profile http   # sadece bu bilgisayar: http://localhost:5069
dotnet run --launch-profile lan    # telefondan erişim için: http://0.0.0.0:5069
```

Telefondan erişim için Windows Güvenlik Duvarı'nda 5069 portuna izin verilmelidir (yönetici PowerShell):

```powershell
New-NetFirewallRule -DisplayName "OTS API 5069" -Direction Inbound -Protocol TCP -LocalPort 5069 -Action Allow -Profile Private
```

## Migration komutları

`dotnet-ef` aracı global olarak kuruludur.

```powershell
cd C:\OnurY\OTS\backend\OtsApi
dotnet ef migrations add <Ad>
dotnet ef database update
```

## Test

`api-tests.http` dosyasını VS Code'da açıp (REST Client eklentisi) her isteğin üstündeki "Send Request" bağlantısına tıklayın.

Uçtan uca test sonucu: POST 201, GET liste, PUT güncelleme, geçersiz POST 400, DELETE 204, silinen kaydı GET 404. Hepsi başarılı.

## Yapılanlar

1. Ön koşullar: .NET 9 SDK, Node.js 24 LTS, dotnet-ef ve PostgreSQL 16 kuruldu.
2. Çözüm ve `OtsApi` Web API projesi oluşturuldu.
3. Modeller, `AppDbContext`, bağlantı dizesi ve `InitialCreate` migration'ı eklendi, veritabanına uygulandı.
4. Öğrenci CRUD endpoint'leri ve `.http` test dosyası yazıldı.
5. Telefondan erişim için `lan` launch profili eklendi.

## Sonraki adımlar

- Course, Topic ve Progress endpoint'leri
- Güvenlik: geliştirme parolasını `appsettings.Development.json` yerine `dotnet user-secrets` ile saklamak, git'e alınacaksa bu dosyayı `.gitignore`'a eklemek
- PostgreSQL'in bilgisayar açılışında otomatik başlaması
