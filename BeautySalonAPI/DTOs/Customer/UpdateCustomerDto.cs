namespace BeautySalonAPI.DTOs.Customer;
// Müşteri güncellerken kullanılır  
public class UpdateCustomerDto
{
    public string FullName { get; set; }
    public string PhoneNumber { get; set; }
    public string? Notes { get; set; }

    // CustomerId parametreden gelir (PUT /api/customers/{id})
    // Appointments/Payments değiştirilmez
}
