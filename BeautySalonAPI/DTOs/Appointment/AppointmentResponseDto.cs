using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    public class AppointmentResponseDto
    {
        public int AppointmentId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;  // Join'den gelecek
        public string CustomerPhone { get; set; } = string.Empty;  // Join'den gelecek
        public int ServiceId { get; set; }
        public string ServiceName { get; set; } = string.Empty;  // Join'den gelecek
        public string CategoryName { get; set; } = string.Empty;  // Join'den gelecek
        public decimal AgreedPrice { get; set; }
        public DateTime? AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
        public string StatusDisplay { get; set; } = string.Empty;  // "Planlandı", "Tamamlandı" vs.
        
        // Uzman bilgileri
        public int? SpecialistId { get; set; }
        public string? SpecialistName { get; set; }
        
        // Seans bilgileri CustomerServiceSession'dan gelecek
        public int? CustomerServiceSessionId { get; set; }
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        public int UsedSessions { get; set; }
    }
}