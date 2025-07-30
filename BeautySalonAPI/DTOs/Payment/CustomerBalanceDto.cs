namespace BeautySalonAPI.DTOs.Payment
{
    public class CustomerBalanceDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public decimal TotalAgreedAmount { get; set; }    // Toplam anlaşmalı tutar
        public decimal TotalPaidAmount { get; set; }      // Toplam ödenen
        public decimal PendingAmount { get; set; }        // Bekleyen ödemeler
        public decimal RemainingDebt { get; set; }        // Kalan borç
        public decimal OverPaid { get; set; }             // Fazla ödeme (kredi)
        public int TotalPayments { get; set; }            // Ödeme sayısı
        public DateTime? LastPaymentDate { get; set; }    // Son ödeme tarihi
    }
}