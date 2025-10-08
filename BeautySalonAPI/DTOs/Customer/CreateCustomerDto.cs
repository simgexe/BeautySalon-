#nullable enable
namespace BeautySalonAPI.DTOs.Customer
{
    // Yeni müşteri eklerken kullanılır
    public class CreateCustomerDto
    {
        public required string FullName { get; set; }
        public required string PhoneNumber { get; set; }
        public string? Notes { get; set; }

        // CustomerId yok - sistem otomatik verecek
        // Appointments/Payments yok - henüz müşteri yok
    }
}