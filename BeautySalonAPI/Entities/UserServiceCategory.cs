namespace BeautySalonAPI.Entities
{
    /// <summary>
    /// Kullanıcı ve ServiceCategory arasındaki many-to-many ilişki
    /// Specialist rolündeki kullanıcılar için hangi kategorilerde uzman olduklarını belirtir
    /// </summary>
    public class UserServiceCategory
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        
        public int ServiceCategoryId { get; set; }
        public ServiceCategory ServiceCategory { get; set; } = null!;
        
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}
