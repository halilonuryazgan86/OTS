using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

// Date: öğretmenin girdiği işlem tarihi-saati; boşsa "şimdi" kullanılır.
public record ProgressRequest(ProgressStatus Status, DateTimeOffset? Date);
public record ProgressResponse(int TopicId, string TopicName, int CourseId, string CourseName,
    ProgressStatus Status, DateTime? StatusDate, DateTime? UpdatedAt, int CommentCount, string? LastComment);
public record CommentRequest(string Text);
public record CommentResponse(int Id, string Text, DateTime CreatedAt, int AuthorId, string AuthorName, UserRole AuthorRole);

public static class ProgressEndpoints
{
    public static void MapProgressEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/students/{studentId:int}");

        // Öğrencinin öğretmeninin tüm konulardaki durumu; kaydı olmayan konular NotStarted döner.
        // Öğrencinin öğretmeni ve bağlı velileri görebilir.
        g.MapGet("/progress", async (int studentId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var teacherId = await VisibleStudentTeacher(db, studentId, user.UserId());
            if (teacherId is null) return Results.NotFound();

            var progress = await db.Progresses.AsNoTracking()
                .Where(p => p.StudentId == studentId)
                .ToDictionaryAsync(p => p.TopicId);

            // Konu başına yorum sayısı ve en son yorum.
            var comments = await db.ProgressComments.AsNoTracking()
                .Where(c => c.StudentId == studentId)
                .GroupBy(c => c.TopicId)
                .Select(x => new
                {
                    TopicId = x.Key,
                    Count = x.Count(),
                    Last = x.OrderByDescending(c => c.CreatedAt).Select(c => c.Text).First()
                })
                .ToDictionaryAsync(x => x.TopicId);

            var topics = await db.Topics.AsNoTracking()
                .Where(t => t.Course!.TeacherId == teacherId)
                .OrderBy(t => t.Course!.Name).ThenBy(t => t.Order).ThenBy(t => t.Id)
                .Select(t => new { t.Id, t.Name, t.CourseId, CourseName = t.Course!.Name })
                .ToListAsync();

            return Results.Ok(topics.Select(t =>
            {
                progress.TryGetValue(t.Id, out var p);
                comments.TryGetValue(t.Id, out var c);
                return new ProgressResponse(t.Id, t.Name, t.CourseId, t.CourseName,
                    p?.Status ?? ProgressStatus.NotStarted, p?.StatusDate, p?.UpdatedAt, c?.Count ?? 0, c?.Last);
            }));
        }).RequireAuthorization();

        // Kayıt yoksa oluşturur, varsa günceller. Yalnızca öğrencinin öğretmeni, kendi dersindeki konu için.
        g.MapPut("/progress/{topicId:int}", async (int studentId, int topicId, ProgressRequest req, ClaimsPrincipal user,
            AppDbContext db) =>
        {
            if (Validate(req) is { } errors) return Results.ValidationProblem(errors);

            var me = user.UserId();
            if (!await db.Students.AnyAsync(s => s.Id == studentId && s.TeacherId == me)) return Results.NotFound();

            var topic = await db.Topics.AsNoTracking().Where(t => t.Id == topicId && t.Course!.TeacherId == me)
                .Select(t => new { t.Id, t.Name, t.CourseId, CourseName = t.Course!.Name }).FirstOrDefaultAsync();
            if (topic is null) return Results.NotFound();

            var p = await db.Progresses.FirstOrDefaultAsync(x => x.StudentId == studentId && x.TopicId == topicId);
            if (p is null)
            {
                p = new Progress { StudentId = studentId, TopicId = topicId };
                db.Progresses.Add(p);
            }

            var date = req.Date?.UtcDateTime ?? DateTime.UtcNow;
            p.Status = req.Status;
            p.StatusDate = req.Status == ProgressStatus.NotStarted ? null : date;
            p.CompletedAt = req.Status == ProgressStatus.Completed ? date : null;
            p.UpdatedAt = DateTime.UtcNow;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Aynı kayıt eşzamanlı başka bir istekle oluşturulduysa (unique index).
                return Results.Conflict();
            }

            var c = await db.ProgressComments.AsNoTracking()
                .Where(x => x.StudentId == studentId && x.TopicId == topicId)
                .OrderByDescending(x => x.CreatedAt).Select(x => x.Text).ToListAsync();
            return Results.Ok(new ProgressResponse(topic.Id, topic.Name, topic.CourseId, topic.CourseName,
                p.Status, p.StatusDate, p.UpdatedAt, c.Count, c.FirstOrDefault()));
        }).RequireAuthorization("Teacher");

        // Konu yorumları (eskiden yeniye). Öğrencinin öğretmeni ve bağlı velileri okur ve yazar.
        g.MapGet("/topics/{topicId:int}/comments", async (int studentId, int topicId, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (!await CanUseTopic(db, studentId, topicId, user.UserId())) return Results.NotFound();

            return Results.Ok(await db.ProgressComments.AsNoTracking()
                .Where(c => c.StudentId == studentId && c.TopicId == topicId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentResponse(c.Id, c.Text, c.CreatedAt, c.AuthorId, c.Author!.FullName, c.Author.Role))
                .ToListAsync());
        }).RequireAuthorization();

        g.MapPost("/topics/{topicId:int}/comments", async (int studentId, int topicId, CommentRequest req, ClaimsPrincipal user,
            AppDbContext db) =>
        {
            var text = req.Text?.Trim() ?? "";
            if (text.Length is 0 or > 1000)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["text"] = ["Yorum 1 ile 1000 karakter arasında olmalı."] });

            var me = user.UserId();
            if (!await CanUseTopic(db, studentId, topicId, me)) return Results.NotFound();

            var comment = new ProgressComment { StudentId = studentId, TopicId = topicId, AuthorId = me, Text = text };
            db.ProgressComments.Add(comment);
            await db.SaveChangesAsync();

            var author = await db.Users.AsNoTracking().FirstAsync(u => u.Id == me);
            return Results.Ok(new CommentResponse(comment.Id, comment.Text, comment.CreatedAt, me, author.FullName, author.Role));
        }).RequireAuthorization();

        // Yorumu yalnızca yazan kişi silebilir.
        app.MapDelete("/api/comments/{id:int}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var comment = await db.ProgressComments.FirstOrDefaultAsync(c => c.Id == id && c.AuthorId == user.UserId());
            if (comment is null) return Results.NotFound();

            db.ProgressComments.Remove(comment);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();
    }

    // Öğrenciyi görebiliyorsa (öğretmeni veya bağlı velisi) öğrencinin öğretmen kimliğini döner.
    static async Task<int?> VisibleStudentTeacher(AppDbContext db, int studentId, int me)
    {
        var s = await db.Students.AsNoTracking()
            .Where(s => s.Id == studentId && (s.TeacherId == me || s.Parents.Any(p => p.Id == me)))
            .Select(s => new { s.TeacherId })
            .FirstOrDefaultAsync();
        return s?.TeacherId;
    }

    // Konu, öğrencinin öğretmeninin dersine ait olmalı ve kullanıcı öğrenciyi görebilmeli.
    static async Task<bool> CanUseTopic(AppDbContext db, int studentId, int topicId, int me)
    {
        var teacherId = await VisibleStudentTeacher(db, studentId, me);
        return teacherId is not null && await db.Topics.AnyAsync(t => t.Id == topicId && t.Course!.TeacherId == teacherId);
    }

    static Dictionary<string, string[]>? Validate(ProgressRequest r)
    {
        var errors = new Dictionary<string, string[]>();
        if (!Enum.IsDefined(r.Status)) errors["status"] = ["Geçersiz durum."];
        if (r.Date is { } d && (d.Year < 2000 || d > DateTimeOffset.UtcNow.AddDays(1)))
            errors["date"] = ["Tarih geçersiz; ileri bir tarih seçilemez."];
        return errors.Count > 0 ? errors : null;
    }
}
