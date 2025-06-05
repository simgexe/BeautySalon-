namespace BeautySalonAPI.Entities
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Notes { get; set; }

        public ICollection<Appointment> Appointments { get; set; }
        public ICollection<Payment> Payments { get; set; }

    }
}
