namespace BeautySalonAPI.DTOs.Customer;
// Müşteri detay sayfası için (randevular dahil)
public class CustomerDetailDto
{
    public int CustomerId { get; set; }
    public string FullName { get; set; }
    public string PhoneNumber { get; set; }
    public string? Notes { get; set; }

    // İlişkili veriler basit şekilde
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal RemainingDebt { get; set; }
    public DateTime? LastVisit { get; set; }

    // Tam appointment/payment listesi değil - sadece özet
}