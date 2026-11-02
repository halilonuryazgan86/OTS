namespace OtsApi.Models;

public enum UserRole
{
    Teacher = 0,
    Parent = 1
}

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Şifreyi başkası (öğretmen) belirlediyse ilk girişte değiştirilmesi zorunludur.
    public bool MustChangePassword { get; set; }

    // Üst üste hatalı giriş sayısı ve geçici kilidin bitiş zamanı.
    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEnd { get; set; }

    // Velinin bağlı olduğu öğrenciler (öğretmen için boş).
    public List<Student> Children { get; set; } = [];
}
