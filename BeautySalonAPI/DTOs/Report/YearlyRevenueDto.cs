#nullable enable
namespace BeautySalonAPI.DTOs.Report
{
    public class YearlyRevenueDto
    {
        public int Year { get; set; }
        public decimal TotalRevenue { get; set; }
        public int PaymentCount { get; set; }
        public decimal AverageAmount { get; set; }
    }
}


