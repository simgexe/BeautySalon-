using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Payment
{
    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }  // Join'den gelecek
        public int? AppointmentId { get; set; }
        public string? ServiceName { get; set; }  // Join'den gelecek (nullable)
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }
        public string PaymentMethodDisplay { get; set; }  // "Nakit", "Kredi Kartı"
        public PaymentStatus Status { get; set; }
        public string StatusDisplay { get; set; }  // "Ödendi", "Bekliyor"
    }
}