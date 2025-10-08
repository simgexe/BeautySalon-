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
        public string PaymentNotes { get; set; } = string.Empty;
       

        // Navigation properties
        public Customer Customer { get; set; } = null!;
        public Appointment? Appointment { get; set; }
    }

}
