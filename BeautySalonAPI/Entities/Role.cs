using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.Entities
{
    public class Role
    {
        public int RoleId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public ICollection<User> Users { get; set; } = new List<User>(); // Deprecated - geriye uyumluluk için
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
