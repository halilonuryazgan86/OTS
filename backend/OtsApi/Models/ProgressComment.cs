namespace OtsApi.Models;

// Bir öğrencinin bir konusu altında öğretmen ve velinin yazdığı yorumlar.
public class ProgressComment
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int TopicId { get; set; }
    public Topic? Topic { get; set; }
    public int AuthorId { get; set; }
    public User? Author { get; set; }
    public string Text { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
