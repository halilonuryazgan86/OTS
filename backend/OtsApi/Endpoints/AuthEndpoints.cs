using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

public record LoginRequest(string Email, string Password);
public record UserResponse(int Id, string FullName, string Email, UserRole Role, bool MustChangePassword);
public record LoginResponse(string Token, UserResponse User);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record RegisterRequest(string FullName, string Email, string Password);

public static class AuthEndpoints
{
    // Şifre değiştirmesi gereken kullanıcının token'ındaki işaret; bu token yalnızca /me ve /password'e erişebilir.
    public const string MustChangePasswordClaim = "pwd_change";

    const int MaxFailedLogins = 5;
    static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    static readonly PasswordHasher<User> Hasher = new();

    // Olmayan e-posta için de hash doğrulaması yapılır; yanıt süresinden hesabın varlığı anlaşılmasın.
    static readonly string DummyHash = Hasher.HashPassword(new User(), Guid.NewGuid().ToString());

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth");

        g.MapPost("/login", async (LoginRequest req, AppDbContext db, IConfiguration cfg) =>
        {
            var email = NormalizeEmail(req.Email);
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

            // Kilitliyken şifre hiç denenmez; süre dolunca kilit kendiliğinden kalkar.
            if (user?.LockoutEnd > DateTime.UtcNow) return Locked(user.LockoutEnd.Value);

            var result = Hasher.VerifyHashedPassword(user ?? new User(), user?.PasswordHash ?? DummyHash, req.Password ?? "");
            if (user is null)
                return Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "E-posta veya şifre hatalı.");

            if (result == PasswordVerificationResult.Failed)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= MaxFailedLogins)
                {
                    user.FailedLoginCount = 0;
                    user.LockoutEnd = DateTime.UtcNow.Add(LockoutDuration);
                    await db.SaveChangesAsync();
                    return Locked(user.LockoutEnd.Value);
                }
                await db.SaveChangesAsync();

                var remaining = MaxFailedLogins - user.FailedLoginCount;
                var title = remaining <= 2
                    ? $"E-posta veya şifre hatalı. {remaining} deneme hakkınız kaldı; ardından hesabınız {LockoutDuration.TotalMinutes} dakika kilitlenecek."
                    : "E-posta veya şifre hatalı.";
                return Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: title);
            }

            if (user.FailedLoginCount > 0 || user.LockoutEnd is not null)
            {
                user.FailedLoginCount = 0;
                user.LockoutEnd = null;
                await db.SaveChangesAsync();
            }

            return Results.Ok(new LoginResponse(CreateToken(user, cfg), ToResponse(user)));
        }).RequireRateLimiting("login");

        // Bağımsız özel ders öğretmeni kendi hesabını açar. Rol her zaman Teacher'dır; veli hesaplarını öğretmen oluşturur.
        g.MapPost("/register", async (RegisterRequest req, AppDbContext db, IConfiguration cfg) =>
        {
            var email = NormalizeEmail(req.Email);
            var errors = ValidatePassword(req.Password, "password") ?? [];
            if (string.IsNullOrWhiteSpace(req.FullName) || req.FullName.Trim().Length < 3)
                errors["fullName"] = ["Ad soyad en az 3 karakter olmalı."];
            else if (req.FullName.Trim().Length > 200) errors["fullName"] = ["Ad soyad en fazla 200 karakter olabilir."];
            if (!IsValidEmail(email)) errors["email"] = ["Geçersiz e-posta."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            if (await db.Users.AnyAsync(u => u.Email == email))
                return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Bu e-posta ile kayıtlı bir hesap var.");

            var user = new User { FullName = req.FullName.Trim(), Email = email, Role = UserRole.Teacher };
            user.PasswordHash = HashPassword(user, req.Password);
            db.Users.Add(user);
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Aynı e-posta ile eşzamanlı kayıt (unique index).
                return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Bu e-posta ile kayıtlı bir hesap var.");
            }

            return Results.Ok(new LoginResponse(CreateToken(user, cfg), ToResponse(user)));
        }).RequireRateLimiting("register");

        g.MapGet("/me", async (ClaimsPrincipal principal, AppDbContext db) =>
            await db.Users.FindAsync(principal.UserId()) is { } u ? Results.Ok(ToResponse(u)) : Results.Unauthorized())
            .RequireAuthorization("SignedIn");

        // Şifre değişince "şifre değiştirmeli" işareti kalkar ve işaretsiz yeni bir token döner.
        g.MapPut("/password", async (ChangePasswordRequest req, ClaimsPrincipal principal, AppDbContext db, IConfiguration cfg) =>
        {
            if (ValidatePassword(req.NewPassword, "newPassword") is { } errors) return Results.ValidationProblem(errors);
            if (req.NewPassword == req.CurrentPassword)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["newPassword"] = ["Yeni şifre mevcut şifreyle aynı olamaz."] });

            var u = await db.Users.FindAsync(principal.UserId());
            if (u is null) return Results.Unauthorized();
            if (Hasher.VerifyHashedPassword(u, u.PasswordHash, req.CurrentPassword ?? "") == PasswordVerificationResult.Failed)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["currentPassword"] = ["Mevcut şifre hatalı."] });

            u.PasswordHash = Hasher.HashPassword(u, req.NewPassword);
            u.MustChangePassword = false;
            await db.SaveChangesAsync();
            return Results.Ok(new LoginResponse(CreateToken(u, cfg), ToResponse(u)));
        }).RequireAuthorization("SignedIn");
    }

    public static int UserId(this ClaimsPrincipal p) => int.Parse(p.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    public static string HashPassword(User u, string password) => Hasher.HashPassword(u, password);

    public static string NormalizeEmail(string? email) => (email ?? "").Trim().ToLowerInvariant();

    public static bool IsValidEmail(string email) =>
        email.Length is > 0 and <= 200 && MailAddress.TryCreate(email, out _);

    public static Dictionary<string, string[]>? ValidatePassword(string? password, string field) =>
        password is null || password.Length < 8 || password.Length > 100 ||
        !password.Any(char.IsLetter) || !password.Any(char.IsDigit)
            ? new() { [field] = ["Şifre 8-100 karakter olmalı ve en az bir harf ile bir rakam içermeli."] }
            : null;

    public static UserResponse ToResponse(User u) => new(u.Id, u.FullName, u.Email, u.Role, u.MustChangePassword);

    // Öğretmen veli şifresini yenilediğinde: yeni şifre, zorunlu değiştirme ve kilidin kaldırılması.
    public static void SetTemporaryPassword(User u, string password)
    {
        u.PasswordHash = Hasher.HashPassword(u, password);
        u.MustChangePassword = true;
        u.FailedLoginCount = 0;
        u.LockoutEnd = null;
    }

    static IResult Locked(DateTime until)
    {
        var minutes = Math.Max(1, (int)Math.Ceiling((until - DateTime.UtcNow).TotalMinutes));
        return Results.Problem(statusCode: StatusCodes.Status423Locked,
            title: $"Çok fazla hatalı deneme yapıldığı için hesabınız kilitlendi. {minutes} dakika sonra tekrar deneyin.");
    }

    static string CreateToken(User u, IConfiguration cfg)
    {
        var jwt = cfg.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));

        var claims = new Dictionary<string, object>
        {
            [JwtRegisteredClaimNames.Sub] = u.Id.ToString(),
            ["name"] = u.FullName,
            ["role"] = u.Role.ToString()
        };
        if (u.MustChangePassword) claims[MustChangePasswordClaim] = "1";

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Claims = claims,
            Issuer = jwt["Issuer"],
            Audience = jwt["Audience"],
            Expires = DateTime.UtcNow.AddHours(jwt.GetValue("ExpiresHours", 12)),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        });
    }
}
