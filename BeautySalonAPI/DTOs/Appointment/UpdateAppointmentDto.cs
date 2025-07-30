using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Appointment
{
    public class UpdateAppointmentDto
    {
        public int CustomerId { get; set; }
        public int ServiceId { get; set; }
        public decimal AgreedPrice { get; set; }
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
    }
}