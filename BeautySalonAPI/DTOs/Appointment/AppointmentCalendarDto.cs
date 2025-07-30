using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    // Takvim görünümü için optimize edilmiş DTO
    public class AppointmentCalendarDto
    {
        public int AppointmentId { get; set; }
        public string CustomerName { get; set; }
        public string ServiceName { get; set; }
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }

        // Takvimde sadece bu bilgiler lazım - performans için minimal
    }
}