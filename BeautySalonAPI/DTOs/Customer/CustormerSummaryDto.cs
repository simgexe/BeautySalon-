namespace BeautySalonAPI.DTOs.Customer;
// Müşteri listesi için özet bilgi (performans optimizasyonu)
public class CustomerSummaryDto
{
    public int CustomerId { get; set; }
    public string FullName { get; set; }
    public string PhoneNumber { get; set; }

    // Notes yok - liste görünümünde gereksiz
    // Sadece temel bilgiler
}
