
namespace BeautySalonAPI.DTOs.Service
{
    public class UpdateServiceDto
    {
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
    }
}