using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    public class AppointmentResponseDto
    {
        public int AppointmentId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }  // Join'den gelecek
        public string CustomerPhone { get; set; }  // Join'den gelecek
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }  // Join'den gelecek
        public string CategoryName { get; set; }  // Join'den gelecek
        public decimal AgreedPrice { get; set; }
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
        public string StatusDisplay { get; set; }  // "Planlandı", "Tamamlandı" vs.
    }
}