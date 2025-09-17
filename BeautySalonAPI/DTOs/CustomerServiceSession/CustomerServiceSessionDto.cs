namespace BeautySalonAPI.DTOs.CustomerServiceSession
{
    public class CustomerServiceSessionDto
    {
        public int CustomerServiceSessionId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public string CategoryName { get; set; }
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public bool IsActive { get; set; }
        public int UsedSessions => TotalSessions - RemainingSessions;
        public double ProgressPercentage => TotalSessions > 0 ? (double)UsedSessions / TotalSessions * 100 : 0;
    }

    public class CreateCustomerServiceSessionDto
    {
        public int CustomerId { get; set; }
        public int ServiceId { get; set; }
        public int TotalSessions { get; set; }
    }

    public class UpdateCustomerServiceSessionDto
    {
        public int RemainingSessions { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CompletedDate { get; set; }
    }
}
