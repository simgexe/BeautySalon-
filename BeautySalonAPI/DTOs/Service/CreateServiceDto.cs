namespace BeautySalonAPI.DTOs.Service
{
    public class CreateServiceDto
    {
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public int DefaultSessions { get; set; } = 1;
        
    }
}