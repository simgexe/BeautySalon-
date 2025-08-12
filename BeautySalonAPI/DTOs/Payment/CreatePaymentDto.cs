using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Payment
{
    public class CreatePaymentDto
    {
        public int CustomerId { get; set; }
        public int? AppointmentId { get; set; }  // Nullable - genel ödeme olabilir
        public decimal AmountPaid { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }
        public DateTime? PaymentDate { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending; // Varsayılan değer olarak Pending
        public string? PaymentNotes { get; set; }

        
        
        
    }
}