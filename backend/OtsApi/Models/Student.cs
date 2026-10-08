namespace OtsApi.Models;

public class Student
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Email { get; set; }
    public int GradeLevel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Progress> Progresses { get; set; } = [];
}
