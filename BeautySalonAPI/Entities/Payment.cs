namespace BeautySalonAPI.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int CustomerId { get; set; }
        public int? AppointmentId { get; set; }

        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }

        public string PaymentMethod { get; set; }  // örn: "Cash", "Credit Card"
        public string Status { get; set; }         // örn: "Paid", "Pending"

        // Navigation properties
        public Customer Customer { get; set; }
        public Appointment Appointment { get; set; }
    }

}
