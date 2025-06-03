using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.Entities
{
    public class ServiceCategory
    {
        [Key]
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }

        public ICollection<Service> Services { get; set; }
    }
}
