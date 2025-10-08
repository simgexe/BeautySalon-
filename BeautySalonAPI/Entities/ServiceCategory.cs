using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.Entities
{
    public class ServiceCategory
    {
        [Key]
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        // Navigation Properties
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<UserServiceCategory> UserServiceCategories { get; set; } = new List<UserServiceCategory>();
    }
}
