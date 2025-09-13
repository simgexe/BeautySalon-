using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Customer
{
    public class CustomerSessionDto
    {
        public int AppointmentId { get; set; }
        public string ServiceName { get; set; }
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        public decimal AgreedPrice { get; set; }
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
        public string StatusDisplay { get; set; }
        public bool IsActive { get; set; } // Kalan seansı var mı?
    }
}
