using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    public class CreateAppointmentDto
    {
        public int CustomerId { get; set; }
        public int ServiceId { get; set; }
        public decimal AgreedPrice { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int? SpecialistId { get; set; }

        // TotalSessions = Service.DefaultSessions olarak otomatik alınacak
        // RemainingSessions = CustomerServiceSession'dan kontrol edilecek
        // Status = Scheduled olarak başlayacak (sistem belirler)
        // AppointmentId sistem verecek
    }
}