using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    // Takvim görünümü için optimize edilmiş DTO
    public class AppointmentCalendarDto
    {
        public int AppointmentId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }

        // Takvimde sadece bu bilgiler lazım - performans için minimal
    }
}