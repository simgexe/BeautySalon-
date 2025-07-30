namespace BeautySalonAPI.DTOs.Customer
{
    // Yeni müşteri eklerken kullanılır
    public class CreateCustomerDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Notes { get; set; }

        // CustomerId yok - sistem otomatik verecek
        // Appointments/Payments yok - henüz müşteri yok
    }
}