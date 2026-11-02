using System.Net.Mail;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

public record StudentRequest(string FirstName, string LastName, string? Email, int GradeLevel);
public record StudentResponse(int Id, string FirstName, string LastName, string? Email, int GradeLevel, DateTime CreatedAt,
    int CompletedTopics, int TotalTopics);
public record ParentResponse(int Id, string FullName, string Email);
public record StudentDetailResponse(int Id, string FirstName, string LastName, string? Email, int GradeLevel, DateTime CreatedAt,
    int CompletedTopics, int TotalTopics, List<ParentResponse> Parents);
public record ParentRequest(string FullName, string Email, string? Password);
public record AddParentResponse(int Id, string FullName, string Email, bool LinkedExisting);
public record ResetPasswordRequest(string Password);

// Öğretmen yalnızca kendi öğrencilerini görür; başkasının öğrencisi için 404 döner.
public static class StudentEndpoints
{
    public static void MapStudentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/students").RequireAuthorization("Teacher");

        g.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var me = user.UserId();
            var total = await db.Topics.CountAsync(t => t.Course!.TeacherId == me);
            return await db.Students.AsNoTracking().Where(s => s.TeacherId == me)
                .OrderBy(s => s.FirstName).ThenBy(s => s.LastName)
                .Select(s => new StudentResponse(s.Id, s.FirstName, s.LastName, s.Email, s.GradeLevel, s.CreatedAt,
                    s.Progresses.Count(p => p.Status == ProgressStatus.Completed), total))
                .ToListAsync();
        });

        g.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var me = user.UserId();
            var total = await db.Topics.CountAsync(t => t.Course!.TeacherId == me);
            var s = await db.Students.AsNoTracking().Where(s => s.Id == id && s.TeacherId == me)
                .Select(s => new StudentDetailResponse(s.Id, s.FirstName, s.LastName, s.Email, s.GradeLevel, s.CreatedAt,
                    s.Progresses.Count(p => p.Status == ProgressStatus.Completed), total,
                    s.Parents.OrderBy(p => p.FullName).Select(p => new ParentResponse(p.Id, p.FullName, p.Email)).ToList()))
                .FirstOrDefaultAsync();
            return s is null ? Results.NotFound() : Results.Ok(s);
        });

        g.MapPost("/", async (StudentRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);

            var s = new Student
            {
                FirstName = req.FirstName.Trim(),
                LastName = req.LastName.Trim(),
                Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim(),
                GradeLevel = req.GradeLevel,
                TeacherId = user.UserId()
            };
            db.Students.Add(s);
            await db.SaveChangesAsync();
            var total = await db.Topics.CountAsync(t => t.Course!.TeacherId == s.TeacherId);
            return Results.Created($"/api/students/{s.Id}", ToResponse(s, 0, total));
        });

        g.MapPut("/{id:int}", async (int id, StudentRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);

            var s = await FindOwned(db, id, user);
            if (s is null) return Results.NotFound();

            s.FirstName = req.FirstName.Trim();
            s.LastName = req.LastName.Trim();
            s.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();
            s.GradeLevel = req.GradeLevel;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        g.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var s = await FindOwned(db, id, user);
            if (s is null) return Results.NotFound();

            db.Students.Remove(s);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // Veli hesabı oluşturur ve öğrenciye bağlar. E-posta zaten bir veliye aitse (ör. kardeşin velisi)
        // yeni hesap açılmaz, mevcut hesap bağlanır; ad ve şifre değişmez.
        g.MapPost("/{id:int}/parents", async (int id, ParentRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var s = await db.Students.Include(x => x.Parents).FirstOrDefaultAsync(x => x.Id == id && x.TeacherId == user.UserId());
            if (s is null) return Results.NotFound();

            var email = AuthEndpoints.NormalizeEmail(req.Email);
            if (!AuthEndpoints.IsValidEmail(email))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["email"] = ["Geçersiz e-posta."] });

            var parent = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (parent is { Role: not UserRole.Parent })
                return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Bu e-posta bir öğretmen hesabına ait.");

            var linkedExisting = parent is not null;
            if (parent is null)
            {
                var errors = AuthEndpoints.ValidatePassword(req.Password, "password") ?? [];
                if (string.IsNullOrWhiteSpace(req.FullName)) errors["fullName"] = ["Veli adı zorunlu."];
                else if (req.FullName.Trim().Length > 200) errors["fullName"] = ["Veli adı en fazla 200 karakter olabilir."];
                if (errors.Count > 0) return Results.ValidationProblem(errors);

                // İlk şifreyi öğretmen belirlediği için veli ilk girişte değiştirmek zorundadır.
                parent = new User { FullName = req.FullName.Trim(), Email = email, Role = UserRole.Parent };
                AuthEndpoints.SetTemporaryPassword(parent, req.Password!);
                db.Users.Add(parent);
            }

            if (s.Parents.All(p => p.Id != parent.Id)) s.Parents.Add(parent);
            await db.SaveChangesAsync();
            return Results.Ok(new AddParentResponse(parent.Id, parent.FullName, parent.Email, linkedExisting));
        });

        g.MapDelete("/{id:int}/parents/{parentId:int}", async (int id, int parentId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var s = await db.Students.Include(x => x.Parents).FirstOrDefaultAsync(x => x.Id == id && x.TeacherId == user.UserId());
            var parent = s?.Parents.FirstOrDefault(p => p.Id == parentId);
            if (s is null || parent is null) return Results.NotFound();

            s.Parents.Remove(parent);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // Şifresini unutan ya da kilitlenen velinin şifresini öğretmen yeniler (yalnızca kendi öğrencisinin velisi için).
        // Veli kilidi kalkar ve ilk girişte şifresini değiştirmek zorunda kalır.
        g.MapPut("/{id:int}/parents/{parentId:int}/password", async (int id, int parentId, ResetPasswordRequest req,
            ClaimsPrincipal user, AppDbContext db) =>
        {
            if (AuthEndpoints.ValidatePassword(req.Password, "password") is { } errors) return Results.ValidationProblem(errors);

            var me = user.UserId();
            var parent = await db.Users.FirstOrDefaultAsync(u => u.Id == parentId && u.Role == UserRole.Parent &&
                u.Children.Any(c => c.Id == id && c.TeacherId == me));
            if (parent is null) return Results.NotFound();

            AuthEndpoints.SetTemporaryPassword(parent, req.Password);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    static Task<Student?> FindOwned(AppDbContext db, int id, ClaimsPrincipal user)
    {
        var me = user.UserId();
        return db.Students.FirstOrDefaultAsync(s => s.Id == id && s.TeacherId == me);
    }

    static StudentResponse ToResponse(Student s, int completed, int total) =>
        new(s.Id, s.FirstName, s.LastName, s.Email, s.GradeLevel, s.CreatedAt, completed, total);

    static Dictionary<string, string[]>? Validate(StudentRequest r)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(r.FirstName)) errors["firstName"] = ["Ad zorunlu."];
        else if (r.FirstName.Trim().Length > 100) errors["firstName"] = ["Ad en fazla 100 karakter olabilir."];
        if (string.IsNullOrWhiteSpace(r.LastName)) errors["lastName"] = ["Soyad zorunlu."];
        else if (r.LastName.Trim().Length > 100) errors["lastName"] = ["Soyad en fazla 100 karakter olabilir."];
        if (r.GradeLevel is < 1 or > 12) errors["gradeLevel"] = ["Sınıf 1 ile 12 arasında olmalı."];
        if (!string.IsNullOrWhiteSpace(r.Email) &&
            (r.Email.Trim().Length > 200 || !MailAddress.TryCreate(r.Email.Trim(), out _)))
            errors["email"] = ["Geçersiz e-posta."];
        return errors.Count > 0 ? errors : null;
    }
}
