namespace OtsApi.Models;

public class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    public int? TeacherId { get; set; }
    public User? Teacher { get; set; }

    public List<Topic> Topics { get; set; } = [];
}
