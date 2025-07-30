namespace BeautySalonAPI.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int CustomerId { get; set; }
        public int? AppointmentId { get; set; }

        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }

        public PaymentMethodType PaymentMethod { get; set; }
        public PaymentStatus Status { get; set; }        // string değil, enum!

        // Navigation properties
        public Customer Customer { get; set; }
        public Appointment Appointment { get; set; }
    }

}
