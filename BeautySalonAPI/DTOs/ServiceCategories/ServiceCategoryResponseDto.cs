namespace BeautySalonAPI.DTOs.ServiceCategory
{
    public class ServiceCategoryResponseDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int ServiceCount { get; set; }  // Bu kategoride kaç servis var

        // Services collection yok - performans için
        // Gerekirse ayrı endpoint: /api/servicecategories/{id}/services
    }
}