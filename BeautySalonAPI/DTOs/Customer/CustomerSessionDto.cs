namespace BeautySalonAPI.DTOs.Customer
{
    public class CustomerSessionDto
    {
        public int CustomerServiceSessionId { get; set; }
        public string ServiceName { get; set; }
        public string CategoryName { get; set; }
        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }
        public int UsedSessions { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public bool IsActive { get; set; }
        public double ProgressPercentage { get; set; }
    }
}
