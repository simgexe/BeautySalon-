namespace BeautySalonAPI.Entities
{
    public class Appointment
    {
        public int AppointmentId { get; set; }

        public int CustomerId { get; set; }
        public Customer Customer { get; set; }

        public int ServiceId { get; set; }
        public Service Service { get; set; }

        public decimal AgreedPrice { get; set; }
        public decimal PaidAmount { get; set; }

        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }

        public string PaymentMethod { get; set; }
        public int InstallmentCount { get; set; }

        public DateTime AppointmentDate { get; set; }
        public DateTime? NextAppointmentDate { get; set; }

        public string Status { get; set; }
    }
}
