using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Entities
{
    public class Appointment
    {
        public int AppointmentId { get; set; }

        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        public int ServiceId { get; set; }
        public Service Service { get; set; } = null!;

        // Uzman/Specialist
        public int? SpecialistId { get; set; }
        public User? Specialist { get; set; }

        public decimal AgreedPrice { get; set; }

        // Seans paketi referansı
        public int? CustomerServiceSessionId { get; set; }
        public CustomerServiceSession? CustomerServiceSession { get; set; }

        public DateTime? AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
    }
}
