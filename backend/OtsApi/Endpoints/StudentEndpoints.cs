using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

public record StudentRequest(string FirstName, string LastName, string? Email, int GradeLevel);
public record StudentResponse(int Id, string FirstName, string LastName, string? Email, int GradeLevel, DateTime CreatedAt);

public static class StudentEndpoints
{
    public static void MapStudentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/students");

        g.MapGet("/", async (AppDbContext db) =>
            await db.Students.AsNoTracking().OrderBy(s => s.Id).Select(s => ToResponse(s)).ToListAsync());

        g.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.Students.AsNoTracking().Where(s => s.Id == id).Select(s => ToResponse(s)).FirstOrDefaultAsync()
                is { } s ? Results.Ok(s) : Results.NotFound());

        g.MapPost("/", async (StudentRequest req, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);

            var s = new Student
            {
                FirstName = req.FirstName.Trim(),
                LastName = req.LastName.Trim(),
                Email = req.Email?.Trim(),
                GradeLevel = req.GradeLevel
            };
            db.Students.Add(s);
            await db.SaveChangesAsync();
            return Results.Created($"/api/students/{s.Id}", ToResponse(s));
        });

        g.MapPut("/{id:int}", async (int id, StudentRequest req, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);

            var s = await db.Students.FindAsync(id);
            if (s is null) return Results.NotFound();

            s.FirstName = req.FirstName.Trim();
            s.LastName = req.LastName.Trim();
            s.Email = req.Email?.Trim();
            s.GradeLevel = req.GradeLevel;
            await db.SaveChangesAsync();
            return Results.Ok(ToResponse(s));
        });

        g.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var s = await db.Students.FindAsync(id);
            if (s is null) return Results.NotFound();

            db.Students.Remove(s);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    static StudentResponse ToResponse(Student s) =>
        new(s.Id, s.FirstName, s.LastName, s.Email, s.GradeLevel, s.CreatedAt);

    static Dictionary<string, string[]>? Validate(StudentRequest r)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(r.FirstName)) errors["firstName"] = ["Ad zorunlu."];
        if (string.IsNullOrWhiteSpace(r.LastName)) errors["lastName"] = ["Soyad zorunlu."];
        if (r.GradeLevel is < 1 or > 12) errors["gradeLevel"] = ["Sınıf 1 ile 12 arasında olmalı."];
        if (!string.IsNullOrWhiteSpace(r.Email) && !r.Email.Contains('@')) errors["email"] = ["Geçersiz e-posta."];
        return errors.Count > 0 ? errors : null;
    }
}
