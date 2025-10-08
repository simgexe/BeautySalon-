namespace BeautySalonAPI.Entities
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<LaserSession> LaserSessions { get; set; } = new List<LaserSession>();
        public ICollection<RegionalThinningSession> RegionalThinningSessions { get; set; } = new List<RegionalThinningSession>();

    }
}
