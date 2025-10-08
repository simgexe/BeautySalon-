#nullable enable
namespace BeautySalonAPI.DTOs.Report
{
    public class RevenueReportDto
    {
        // Genel İstatistikler
        public decimal TotalRevenue { get; set; }           // Toplam gelir (sadece ödenen)
        public decimal PendingAmount { get; set; }           // Bekleyen ödemeler
        public decimal RefundedAmount { get; set; }          // İade edilen
        public decimal CancelledAmount { get; set; }         // İptal edilen
        
        public int TotalPaymentsCount { get; set; }          // Toplam ödeme sayısı
        public int PaidPaymentsCount { get; set; }           // Ödenen sayısı
        public int PendingPaymentsCount { get; set; }        // Bekleyen sayısı
        
        public decimal AveragePaymentAmount { get; set; }    // Ortalama ödeme tutarı
        
        // Ödeme Yöntemi Dağılımı
        public List<PaymentMethodDistributionDto> PaymentMethodDistribution { get; set; } = new();
        
        // Hizmet Kategorisi Dağılımı
        public List<CategoryRevenueDto> CategoryRevenue { get; set; } = new();
        
        // Hizmet Dağılımı
        public List<ServiceRevenueDto> ServiceRevenue { get; set; } = new();
        
        // En İyi Müşteriler
        public List<TopCustomerDto> TopCustomers { get; set; } = new();
        
        // Uzman Bazlı Gelirler
        public List<SpecialistRevenueDto> SpecialistRevenue { get; set; } = new();
    }
    
    public class PaymentMethodDistributionDto
    {
        public required string PaymentMethod { get; set; }
        public int PaymentMethodValue { get; set; }
        public decimal TotalAmount { get; set; }
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }
    
    public class CategoryRevenueDto
    {
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = "Genel";
        public decimal TotalRevenue { get; set; }
        public int PaymentCount { get; set; }
        public decimal Percentage { get; set; }
    }
    
    public class ServiceRevenueDto
    {
        public int? ServiceId { get; set; }
        public string ServiceName { get; set; } = "Genel Ödeme";
        public string? CategoryName { get; set; }
        public decimal TotalRevenue { get; set; }
        public int PaymentCount { get; set; }
        public decimal Percentage { get; set; }
    }
    
    public class TopCustomerDto
    {
        public int CustomerId { get; set; }
        public required string CustomerName { get; set; }
        public decimal TotalPaid { get; set; }
        public int PaymentCount { get; set; }
        public DateTime? LastPaymentDate { get; set; }
    }
    
    public class SpecialistRevenueDto
    {
        public int? SpecialistId { get; set; }
        public string? SpecialistName { get; set; }
        public decimal TotalRevenue { get; set; }
        public int AppointmentCount { get; set; }
        public decimal AveragePerAppointment { get; set; }
    }
}


