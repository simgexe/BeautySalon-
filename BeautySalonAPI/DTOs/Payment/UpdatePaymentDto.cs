using BeautySalonAPI.Entities;

namespace BeautySalonAPI.DTOs.Payment
{
    public class UpdatePaymentDto
    {
        public int CustomerId { get; set; }
        public int? AppointmentId { get; set; }
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }
        public PaymentStatus Status { get; set; }
      
        public string? PaymentNotes { get; set; }
    }
}