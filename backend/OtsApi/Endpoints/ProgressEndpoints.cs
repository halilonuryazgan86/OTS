using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

public record ProgressRequest(ProgressStatus Status, string? Note);
public record ProgressResponse(int TopicId, string TopicName, int CourseId, string CourseName,
    ProgressStatus Status, DateTime? CompletedAt, string? Note);

public static class ProgressEndpoints
{
    public static void MapProgressEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/students/{studentId:int}/progress");

        // Öğrencinin tüm konulardaki durumu; kaydı olmayan konular NotStarted döner.
        g.MapGet("/", async (int studentId, AppDbContext db) =>
        {
            if (!await db.Students.AnyAsync(s => s.Id == studentId)) return Results.NotFound();

            var progress = await db.Progresses.AsNoTracking()
                .Where(p => p.StudentId == studentId)
                .ToDictionaryAsync(p => p.TopicId);

            var topics = await db.Topics.AsNoTracking()
                .OrderBy(t => t.CourseId).ThenBy(t => t.Order).ThenBy(t => t.Id)
                .Select(t => new { t.Id, t.Name, t.CourseId, CourseName = t.Course!.Name })
                .ToListAsync();

            return Results.Ok(topics.Select(t => progress.TryGetValue(t.Id, out var p)
                ? new ProgressResponse(t.Id, t.Name, t.CourseId, t.CourseName, p.Status, p.CompletedAt, p.Note)
                : new ProgressResponse(t.Id, t.Name, t.CourseId, t.CourseName, ProgressStatus.NotStarted, null, null)));
        });

        // Kayıt yoksa oluşturur, varsa günceller.
        g.MapPut("/{topicId:int}", async (int studentId, int topicId, ProgressRequest req, AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);
            if (!await db.Students.AnyAsync(s => s.Id == studentId)) return Results.NotFound();

            var topic = await db.Topics.AsNoTracking().Where(t => t.Id == topicId)
                .Select(t => new { t.Id, t.Name, t.CourseId, CourseName = t.Course!.Name }).FirstOrDefaultAsync();
            if (topic is null) return Results.NotFound();

            var p = await db.Progresses.FirstOrDefaultAsync(x => x.StudentId == studentId && x.TopicId == topicId);
            if (p is null)
            {
                p = new Progress { StudentId = studentId, TopicId = topicId };
                db.Progresses.Add(p);
            }

            p.Status = req.Status;
            p.CompletedAt = req.Status == ProgressStatus.Completed ? p.CompletedAt ?? DateTime.UtcNow : null;
            p.Note = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim();

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Aynı kayıt eşzamanlı başka bir istekle oluşturulduysa (unique index).
                return Results.Conflict();
            }

            return Results.Ok(new ProgressResponse(topic.Id, topic.Name, topic.CourseId, topic.CourseName,
                p.Status, p.CompletedAt, p.Note));
        });
    }

    static Dictionary<string, string[]>? Validate(ProgressRequest r)
    {
        var errors = new Dictionary<string, string[]>();
        if (!Enum.IsDefined(r.Status)) errors["status"] = ["Geçersiz durum."];
        if (r.Note?.Trim().Length > 500) errors["note"] = ["Not en fazla 500 karakter olabilir."];
        return errors.Count > 0 ? errors : null;
    }
}
