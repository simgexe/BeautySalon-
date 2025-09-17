namespace BeautySalonAPI.Entities
{
    public class CustomerServiceSession
    {
        public int CustomerServiceSessionId { get; set; }
        
        public int CustomerId { get; set; }
        public Customer Customer { get; set; }
        
        public int ServiceId { get; set; }
        public Service Service { get; set; }
        
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        
        public DateTime CreatedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Bu seans paketindeki randevular
        public ICollection<Appointment> Appointments { get; set; }
    }
}
