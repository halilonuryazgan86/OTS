namespace OtsApi.Models;

public class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    public List<Topic> Topics { get; set; } = [];
}
