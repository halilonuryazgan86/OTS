using Microsoft.EntityFrameworkCore;
using OtsApi.Models;

namespace OtsApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Progress> Progresses => Set<Progress>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Student>(e =>
        {
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200);
        });

        b.Entity<Course>().Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Entity<Topic>().Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Entity<Progress>().Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Entity<Progress>().HasIndex(x => new { x.StudentId, x.TopicId }).IsUnique();
    }
}
