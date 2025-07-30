
namespace BeautySalonAPI.DTOs.ServiceCategory
{
    public class ServiceCategoryWithServicesDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public List<ServiceSummaryDto> Services { get; set; }
    }

    // ServiceSummaryDto iç içe kullanım için
    public class ServiceSummaryDto
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
    }
}