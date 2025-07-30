namespace BeautySalonAPI.DTOs.Service
{
    public class ServiceResponseDto
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }  // Join'den gelecek
    }
}