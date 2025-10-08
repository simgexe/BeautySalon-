
namespace BeautySalonAPI.DTOs.ServiceCategory
{
    public class ServiceCategoryWithServicesDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public List<ServiceSummaryDto> Services { get; set; } = new List<ServiceSummaryDto>();
    }

    // ServiceSummaryDto iç içe kullanım için
    public class ServiceSummaryDto
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}