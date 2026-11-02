using Microsoft.EntityFrameworkCore;
using OtsApi.Endpoints;
using OtsApi.Models;

namespace OtsApi.Data;

// Yalnızca Development ortamında çalışır: appsettings.Development.json'daki Seed:Teachers hesaplarını oluşturur.
public static class DevSeed
{
    record SeedTeacher(string FullName, string Email, string Password);

    public static async Task RunAsync(WebApplication app)
    {
        var teachers = app.Configuration.GetSection("Seed:Teachers").Get<List<SeedTeacher>>() ?? [];
        if (teachers.Count == 0) return;

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        int? firstId = null;
        foreach (var t in teachers)
        {
            var email = AuthEndpoints.NormalizeEmail(t.Email);
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
            {
                user = new User { FullName = t.FullName, Email = email, Role = UserRole.Teacher };
                user.PasswordHash = AuthEndpoints.HashPassword(user, t.Password);
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            firstId ??= user.Id;
        }

        // Öğretmen yapısından önce eklenmiş (sahipsiz) kayıtlar ilk öğretmene aktarılır.
        await db.Students.Where(s => s.TeacherId == null).ExecuteUpdateAsync(x => x.SetProperty(s => s.TeacherId, firstId));
        await db.Courses.Where(c => c.TeacherId == null).ExecuteUpdateAsync(x => x.SetProperty(c => c.TeacherId, firstId));
    }
}
