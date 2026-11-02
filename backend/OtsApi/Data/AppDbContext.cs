using Microsoft.EntityFrameworkCore;
using OtsApi.Models;

namespace OtsApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Progress> Progresses => Set<Progress>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ProgressComment> ProgressComments => Set<ProgressComment>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Student>(e =>
        {
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200);
            e.HasOne(x => x.Teacher).WithMany().HasForeignKey(x => x.TeacherId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Parents).WithMany(x => x.Children).UsingEntity("StudentParents");
        });

        b.Entity<User>(e =>
        {
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
        });

        b.Entity<Course>().Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Entity<Course>().HasOne(x => x.Teacher).WithMany().HasForeignKey(x => x.TeacherId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<Topic>().Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Entity<Progress>().Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Entity<Progress>().Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
        // "Son güncellemeler" (ana sayfa, veli akışı) en yeni kayıtları tüm tabloyu sıralamadan okusun.
        b.Entity<Progress>().HasIndex(x => x.UpdatedAt);

        b.Entity<ProgressComment>(e =>
        {
            e.Property(x => x.Text).HasMaxLength(1000).IsRequired();
            e.HasOne(x => x.Author).WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Cascade);
            // Bir konunun yorumları tarih sırasıyla okunur; son güncellemeler de en yeni yorumu arar.
            e.HasIndex(x => new { x.StudentId, x.TopicId, x.CreatedAt });
            e.HasIndex(x => x.CreatedAt);
        });
        b.Entity<Progress>().HasIndex(x => new { x.StudentId, x.TopicId }).IsUnique();
    }
}
