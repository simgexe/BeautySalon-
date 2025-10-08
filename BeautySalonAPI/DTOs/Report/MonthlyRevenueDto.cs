#nullable enable
namespace BeautySalonAPI.DTOs.Report
{
    public class MonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public int PaymentCount { get; set; }
        public decimal AverageAmount { get; set; }
    }
}


