using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Payment
{
    public class CreatePaymentDto
    {
        public int CustomerId { get; set; }
        public int? AppointmentId { get; set; }  // Nullable - genel ödeme olabilir
        public decimal AmountPaid { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }

        // PaymentDate sistem belirleyecek (DateTime.Now)
        // Status default Paid olacak
        // PaymentId sistem verecek
    }
}