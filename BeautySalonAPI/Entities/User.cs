using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.Entities
{
    public class User
    {
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string? FirstName { get; set; }
        
        [MaxLength(100)]
        public string? LastName { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastLoginAt { get; set; }
        
        // Foreign Keys - Geriye uyumluluk için ana rol (deprecated - UserRoles kullanılacak)
        public int? RoleId { get; set; }
        public Role? Role { get; set; }
        
        // Navigation Properties
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<UserServiceCategory> UserServiceCategories { get; set; } = new List<UserServiceCategory>();
    }
}
