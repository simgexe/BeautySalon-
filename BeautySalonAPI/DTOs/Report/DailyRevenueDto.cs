#nullable enable
namespace BeautySalonAPI.DTOs.Report
{
    public class DailyRevenueDto
    {
        public DateTime Date { get; set; }
        public decimal TotalRevenue { get; set; }
        public int PaymentCount { get; set; }
        public decimal AverageAmount { get; set; }
    }
}


