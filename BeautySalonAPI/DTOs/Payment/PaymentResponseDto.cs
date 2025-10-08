#nullable enable
using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Payment
{
    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }
        public int CustomerId { get; set; }
        public required string CustomerName { get; set; }  // Join'den gelecek
        public int? AppointmentId { get; set; }
        public string? ServiceName { get; set; }  // Join'den gelecek (nullable)
        public string? SpecialistName { get; set; }  // Uzman adı (nullable)
        public DateTime? AppointmentDate { get; set; }  // Randevu tarihi (nullable)
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }
        public required string PaymentMethodDisplay { get; set; }  // "Nakit", "Kredi Kartı"
        public PaymentStatus Status { get; set; }
        public required string StatusDisplay { get; set; }  // "Ödendi", "Bekliyor"
        public string? PaymentNotes { get; set; }
    }
}