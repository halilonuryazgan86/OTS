namespace OtsApi.Models;

public class Topic
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public Course? Course { get; set; }
    public string Name { get; set; } = "";
    public int Order { get; set; }
}
