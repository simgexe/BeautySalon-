#nullable enable
using BeautySalonAPI.DTOs.CustomerServiceSession;

namespace BeautySalonAPI.DTOs.Customer;

public class CustomerDetailDto
{
    public int CustomerId { get; set; }
    public required string FullName { get; set; }
    public required string PhoneNumber { get; set; }
    public string? Notes { get; set; }

    // Finansal Durum
    public decimal TotalDebt { get; set; }        // Toplam borç (tüm planlanan/onaylanan/tamamlanan randevuların fiyatları)
    public decimal TotalPaid { get; set; }        // Toplam ödenen miktar
    public decimal NetDebt { get; set; }          // Net borç (TotalDebt - TotalPaid)
    
    // Seans Bilgileri (tüm aktif seans paketlerinden toplam)
    public int TotalSessions { get; set; }        // Toplam seans sayısı
    public int RemainingSessions { get; set; }    // Kalan seans sayısı
    public int UsedSessions { get; set; }         // Kullanılan seans sayısı
    
    // İstatistikler
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public DateTime? LastVisit { get; set; }
    
    // Lazer takip sayfası için
    public DateTime? FirstAppointmentDate { get; set; }
    public string? SpecialistName { get; set; }
    
    // Detay listeleri
    public List<CustomerServiceSessionDto> Sessions { get; set; } = new();
    public List<AppointmentHistoryDto> AppointmentHistory { get; set; } = new();
    public List<PaymentHistoryDto> PaymentHistory { get; set; } = new();
}

public class AppointmentHistoryDto
{
    public int AppointmentId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public required string ServiceName { get; set; }
    public required string ServiceCategory { get; set; }
    public decimal AgreedPrice { get; set; }
    public required string Status { get; set; }
    public int? CustomerServiceSessionId { get; set; }
    public int TotalSessions { get; set; }
    public int RemainingSessions { get; set; }
}

public class PaymentHistoryDto
{
    public int PaymentId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal AmountPaid { get; set; }
    public required string PaymentMethod { get; set; }
    public required string Status { get; set; }
    public string? PaymentNotes { get; set; }
    public string? AppointmentInfo { get; set; }
}