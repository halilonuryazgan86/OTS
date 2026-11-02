using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

// Akıştaki bir olay: durum değişikliği (Kind = "Status") ya da yorum (Kind = "Comment").
public record ActivityResponse(string Kind, int StudentId, string StudentName, int TopicId, string TopicName, string CourseName,
    ProgressStatus? Status, string? Text, string? AuthorName, DateTime Date);
public record DashboardResponse(int StudentCount, int CourseCount, int TopicCount, int CompletedCount,
    List<ActivityResponse> RecentActivity);
public record ChildResponse(int Id, string FirstName, string LastName, int GradeLevel, string? TeacherName,
    int CompletedTopics, int TotalTopics);

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        // Öğretmen ana sayfası: özet sayılar, son durum değişiklikleri ve velilerden gelen yorumlar.
        app.MapGet("/api/dashboard", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var me = user.UserId();
            var mine = db.Progresses.Where(p => p.Student!.TeacherId == me);

            return new DashboardResponse(
                await db.Students.CountAsync(s => s.TeacherId == me),
                await db.Courses.CountAsync(c => c.TeacherId == me),
                await db.Topics.CountAsync(t => t.Course!.TeacherId == me),
                await mine.CountAsync(p => p.Status == ProgressStatus.Completed),
                await Feed(mine, db.ProgressComments.Where(c => c.Student!.TeacherId == me && c.AuthorId != me), 10));
        }).RequireAuthorization("Teacher");

        var my = app.MapGroup("/api/my").RequireAuthorization("Parent");

        // Velinin bağlı olduğu çocuklar.
        my.MapGet("/children", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var me = user.UserId();
            return await db.Students.AsNoTracking().Where(s => s.Parents.Any(p => p.Id == me))
                .OrderBy(s => s.FirstName)
                .Select(s => new ChildResponse(s.Id, s.FirstName, s.LastName, s.GradeLevel,
                    s.Teacher != null ? s.Teacher.FullName : null,
                    s.Progresses.Count(p => p.Status == ProgressStatus.Completed),
                    db.Topics.Count(t => t.Course!.TeacherId == s.TeacherId)))
                .ToListAsync();
        });

        // Velinin çocuklarına ait son durum değişiklikleri ve öğretmen yorumları.
        my.MapGet("/activity", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var me = user.UserId();
            return await Feed(
                db.Progresses.Where(p => p.Student!.Parents.Any(x => x.Id == me)),
                db.ProgressComments.Where(c => c.Student!.Parents.Any(x => x.Id == me) && c.AuthorId != me),
                30);
        });
    }

    // Her iki kaynaktan en yeni "take" kaydı alır, tarihe göre birleştirir (index'ler sayesinde tablo taranmaz).
    static async Task<List<ActivityResponse>> Feed(IQueryable<Progress> progress, IQueryable<ProgressComment> comments, int take)
    {
        var statuses = await progress.AsNoTracking().OrderByDescending(p => p.UpdatedAt).Take(take)
            .Select(p => new ActivityResponse("Status", p.StudentId, p.Student!.FirstName + " " + p.Student.LastName,
                p.TopicId, p.Topic!.Name, p.Topic.Course!.Name, p.Status, null, null, p.UpdatedAt))
            .ToListAsync();

        var notes = await comments.AsNoTracking().OrderByDescending(c => c.CreatedAt).Take(take)
            .Select(c => new ActivityResponse("Comment", c.StudentId, c.Student!.FirstName + " " + c.Student.LastName,
                c.TopicId, c.Topic!.Name, c.Topic.Course!.Name, null, c.Text, c.Author!.FullName, c.CreatedAt))
            .ToListAsync();

        return statuses.Concat(notes).OrderByDescending(a => a.Date).Take(take).ToList();
    }
}
