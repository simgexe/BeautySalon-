namespace BeautySalonAPI.DTOs.User
{
    public class UserResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        
        // Kullanıcının rolleri
        public List<RoleInfoDto> Roles { get; set; } = new List<RoleInfoDto>();
        
        // Specialist rolündeki kullanıcılar için uzmanlık kategorileri
        public List<ServiceCategoryInfoDto> ServiceCategories { get; set; } = new List<ServiceCategoryInfoDto>();
    }

    public class RoleInfoDto
    {
        public int RoleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ServiceCategoryInfoDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }
}
