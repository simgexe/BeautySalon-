using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.Entities
{
    public class User
    {
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Username { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Email { get; set; }
        
        [Required]
        public string PasswordHash { get; set; }
        
        [MaxLength(100)]
        public string FirstName { get; set; }
        
        [MaxLength(100)]
        public string LastName { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastLoginAt { get; set; }
        
        // Foreign Keys
        public int RoleId { get; set; }
        public Role Role { get; set; }
        
        // Navigation Properties - sadece salon çalışanları için
    }
}
