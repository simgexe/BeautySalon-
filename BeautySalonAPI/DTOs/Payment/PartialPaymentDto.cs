using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Payment
{
    public class PartialPaymentDto
    {
        public int AppointmentId { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }
        public string PaymentNotes { get; set; } = string.Empty;

        // CustomerId randevudan alınacak
        // PaymentDate sistem belirleyecek
        // Status otomatik Paid olacak
    }
}