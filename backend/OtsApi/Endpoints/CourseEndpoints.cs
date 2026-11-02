using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

public record CourseRequest(string Name);
public record TopicRequest(string Name, int Order);
public record TopicResponse(int Id, int CourseId, string Name, int Order);
public record CourseResponse(int Id, string Name, List<TopicResponse> Topics);

public static class CourseEndpoints
{
    public static void MapCourseEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/courses");

        g.MapGet("/", async (AppDbContext db) =>
            await db.Courses.AsNoTracking().OrderBy(c => c.Id).Select(c => new CourseResponse(c.Id, c.Name,
                c.Topics.OrderBy(t => t.Order).ThenBy(t => t.Id)
                    .Select(t => new TopicResponse(t.Id, t.CourseId, t.Name, t.Order)).ToList())).ToListAsync());

        g.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.Courses.AsNoTracking().Where(c => c.Id == id).Select(c => new CourseResponse(c.Id, c.Name,
                c.Topics.OrderBy(t => t.Order).ThenBy(t => t.Id)
                    .Select(t => new TopicResponse(t.Id, t.CourseId, t.Name, t.Order)).ToList())).FirstOrDefaultAsync()
                is { } c ? Results.Ok(c) : Results.NotFound());

        g.MapPost("/", async (CourseRequest req, AppDbContext db) =>
        {
            if (ValidateName(req.Name, "Ders adı") is { } errors) return Results.ValidationProblem(errors);

            var c = new Course { Name = req.Name.Trim() };
            db.Courses.Add(c);
            await db.SaveChangesAsync();
            return Results.Created($"/api/courses/{c.Id}", new CourseResponse(c.Id, c.Name, []));
        });

        g.MapPut("/{id:int}", async (int id, CourseRequest req, AppDbContext db) =>
        {
            if (ValidateName(req.Name, "Ders adı") is { } errors) return Results.ValidationProblem(errors);

            var c = await db.Courses.FindAsync(id);
            if (c is null) return Results.NotFound();

            c.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // Dersin konuları ve bu konulara ait ilerleme kayıtları da (cascade) silinir.
        g.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var c = await db.Courses.FindAsync(id);
            if (c is null) return Results.NotFound();

            db.Courses.Remove(c);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        g.MapPost("/{id:int}/topics", async (int id, TopicRequest req, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);
            if (!await db.Courses.AnyAsync(c => c.Id == id)) return Results.NotFound();

            var t = new Topic { CourseId = id, Name = req.Name.Trim(), Order = req.Order };
            db.Topics.Add(t);
            await db.SaveChangesAsync();
            return Results.Created($"/api/topics/{t.Id}", ToResponse(t));
        });

        var topics = app.MapGroup("/api/topics");

        topics.MapPut("/{id:int}", async (int id, TopicRequest req, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);

            var t = await db.Topics.FindAsync(id);
            if (t is null) return Results.NotFound();

            t.Name = req.Name.Trim();
            t.Order = req.Order;
            await db.SaveChangesAsync();
            return Results.Ok(ToResponse(t));
        });

        topics.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var t = await db.Topics.FindAsync(id);
            if (t is null) return Results.NotFound();

            db.Topics.Remove(t);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    static TopicResponse ToResponse(Topic t) => new(t.Id, t.CourseId, t.Name, t.Order);

    static Dictionary<string, string[]>? ValidateName(string? name, string label)
    {
        if (string.IsNullOrWhiteSpace(name)) return new() { ["name"] = [$"{label} zorunlu."] };
        if (name.Trim().Length > 200) return new() { ["name"] = [$"{label} en fazla 200 karakter olabilir."] };
        return null;
    }

    static Dictionary<string, string[]>? Validate(TopicRequest r)
    {
        var errors = ValidateName(r.Name, "Konu adı") ?? [];
        if (r.Order is < 0 or > 10000) errors["order"] = ["Sıra 0 ile 10000 arasında olmalı."];
        return errors.Count > 0 ? errors : null;
    }
}
