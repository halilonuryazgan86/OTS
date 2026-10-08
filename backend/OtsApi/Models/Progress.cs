namespace OtsApi.Models;

public enum ProgressStatus
{
    NotStarted = 0,
    InProgress = 1,
    Completed = 2
}

public class Progress
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int TopicId { get; set; }
    public Topic? Topic { get; set; }
    public ProgressStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Note { get; set; }
}
