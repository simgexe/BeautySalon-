using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    public class CreateAppointmentDto
    {
        public int CustomerId { get; set; }
        public int ServiceId { get; set; }
        public decimal AgreedPrice { get; set; }
        public int TotalSessions { get; set; }
        public DateTime AppointmentDate { get; set; }

        // RemainingSessions = TotalSessions olarak başlayacak (sistem hesaplar)
        // Status = Scheduled olarak başlayacak (sistem belirler)
        // AppointmentId sistem verecek
    }
}