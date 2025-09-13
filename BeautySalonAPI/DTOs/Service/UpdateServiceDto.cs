
namespace BeautySalonAPI.DTOs.Service
{
    public class UpdateServiceDto
    {
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        
        // Seans bilgileri
        public int DefaultSessions { get; set; }
        public bool IsMultiSession { get; set; }
    }
}