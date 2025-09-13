namespace BeautySalonAPI.Entities
{
    public class Service
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        
        // Seans bilgileri
        public int DefaultSessions { get; set; } = 1; // Varsayılan seans sayısı
        public bool IsMultiSession { get; set; } = false; // Çok seanslı mı?

        public int CategoryId { get; set; }
        public ServiceCategory Category { get; set; }

        public ICollection<Appointment> Appointments { get; set; }
    }
}
