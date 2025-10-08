namespace BeautySalonAPI.DTOs.Role
{
    public class RoleResponseDto
    {
        public int RoleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Kaç kullanıcının bu rolü olduğu
        public int UserCount { get; set; }
    }
}
