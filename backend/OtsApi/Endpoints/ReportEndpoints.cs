using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Models;

namespace OtsApi.Endpoints;

public record StatusTotals(int Completed, int InProgress, int NotStarted);
public record CourseReport(int Id, string Name, int TopicCount, int Completed, int InProgress, int Possible);
public record StudentReport(int Id, string Name, int GradeLevel, int Completed, int InProgress, int Total);
public record GradeReport(int GradeLevel, int StudentCount, int Completed, int Possible);
public record WeekReport(DateTime WeekStart, int Completed);
public record ReportResponse(int StudentCount, int TopicCount, StatusTotals Totals, List<CourseReport> Courses,
    List<StudentReport> Students, List<GradeReport> Grades, List<WeekReport> Weeks);

// Öğretmenin "Genel başarı" raporu. Sayılar veritabanında gruplanarak hesaplanır.
public static class ReportEndpoints
{
    record CountRow(int StudentId, int CourseId, ProgressStatus Status, int Count);

    const int WeekCount = 8;

    static int Done(IEnumerable<CountRow> rows) => rows.Where(r => r.Status == ProgressStatus.Completed).Sum(r => r.Count);
    static int Doing(IEnumerable<CountRow> rows) => rows.Where(r => r.Status == ProgressStatus.InProgress).Sum(r => r.Count);

    static readonly TimeZoneInfo Turkey = FindTurkeyTimeZone();

    public static void MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reports/summary", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var me = user.UserId();

            var students = await db.Students.AsNoTracking().Where(s => s.TeacherId == me)
                .Select(s => new { s.Id, Name = s.FirstName + " " + s.LastName, s.GradeLevel })
                .ToListAsync();
            var courses = await db.Courses.AsNoTracking().Where(c => c.TeacherId == me).OrderBy(c => c.Name)
                .Select(c => new { c.Id, c.Name, TopicCount = c.Topics.Count })
                .ToListAsync();
            var topicCount = courses.Sum(c => c.TopicCount);

            // Öğrenci × ders × durum bazında kayıt sayıları (Başlamadı kayıtları sayılmaz; kalan = başlamadı).
            var counts = await db.Progresses.AsNoTracking()
                .Where(p => p.Student!.TeacherId == me && p.Status != ProgressStatus.NotStarted)
                .GroupBy(p => new { p.StudentId, p.Topic!.CourseId, p.Status })
                .Select(g => new CountRow(g.Key.StudentId, g.Key.CourseId, g.Key.Status, g.Count()))
                .ToListAsync();

            var completed = Done(counts);
            var inProgress = Doing(counts);
            var possible = students.Count * topicCount;

            var byStudent = counts.GroupBy(c => c.StudentId).ToDictionary(g => g.Key, g => g.ToList());
            var byCourse = counts.GroupBy(c => c.CourseId).ToDictionary(g => g.Key, g => g.ToList());

            var studentReports = students
                .Select(s =>
                {
                    List<CountRow> rows = byStudent.GetValueOrDefault(s.Id) ?? [];
                    return new StudentReport(s.Id, s.Name, s.GradeLevel, Done(rows), Doing(rows), topicCount);
                })
                .OrderByDescending(s => s.Completed).ThenBy(s => s.Name)
                .ToList();

            var courseReports = courses
                .Select(c =>
                {
                    List<CountRow> rows = byCourse.GetValueOrDefault(c.Id) ?? [];
                    return new CourseReport(c.Id, c.Name, c.TopicCount, Done(rows), Doing(rows), c.TopicCount * students.Count);
                })
                .ToList();

            var gradeReports = studentReports.GroupBy(s => s.GradeLevel).OrderBy(g => g.Key)
                .Select(g => new GradeReport(g.Key, g.Count(), g.Sum(s => s.Completed), g.Count() * topicCount))
                .ToList();

            return new ReportResponse(students.Count, topicCount,
                new StatusTotals(completed, inProgress, Math.Max(0, possible - completed - inProgress)),
                courseReports, studentReports, gradeReports, await Weeks(db, me));
        }).RequireAuthorization("Teacher");
    }

    // Son 8 haftada (Pazartesi başlangıçlı, Türkiye saati) tamamlanan konu sayıları; boş haftalar 0 döner.
    static async Task<List<WeekReport>> Weeks(AppDbContext db, int teacherId)
    {
        var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Turkey).Date;
        var thisWeek = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var firstWeek = thisWeek.AddDays(-7 * (WeekCount - 1));
        var sinceUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(firstWeek, DateTimeKind.Unspecified), Turkey);

        var completedAt = await db.Progresses.AsNoTracking()
            .Where(p => p.Student!.TeacherId == teacherId && p.Status == ProgressStatus.Completed && p.CompletedAt >= sinceUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new { Day = g.Key, Count = g.Count() })
            .ToListAsync();

        var weeks = Enumerable.Range(0, WeekCount).Select(i => firstWeek.AddDays(7 * i)).ToList();
        return weeks.Select(w => new WeekReport(w, completedAt
                .Where(d =>
                {
                    var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(d.Day, DateTimeKind.Utc), Turkey);
                    return local >= w && local < w.AddDays(7);
                })
                .Sum(d => d.Count)))
            .ToList();
    }

    static TimeZoneInfo FindTurkeyTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul"); }
        catch (TimeZoneNotFoundException) { return TimeZoneInfo.CreateCustomTimeZone("TR", TimeSpan.FromHours(3), "TR", "TR"); }
    }
}
