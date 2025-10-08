#nullable enable
namespace BeautySalonAPI.DTOs.Customer;
// API'dan müşteri bilgisi dönerken kullanılır
public class CustomerResponseDto
{
    public int CustomerId { get; set; }
    public required string FullName { get; set; }
    public required string PhoneNumber { get; set; }
    public string? Notes { get; set; }

    // İlişkili veriler yok - performans için
    // Gerekirse ayrı endpoint: /api/customers/{id}/appointments
}
