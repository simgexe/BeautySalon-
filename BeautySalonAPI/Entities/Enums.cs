namespace BeautySalonAPI.Entities
{
    public enum PaymentMethodType
    {
        Cash = 1,
        CreditCard = 2,
        DebitCard = 3,
        BankTransfer = 4
    }

    public enum PaymentStatus
    {
        Pending = 1,        // Ödeme bekliyor
        Paid = 2,           // Ödendi
        Cancelled = 3,      // İptal edildi
        Refunded = 4        // İade edildi
    }

    public enum AppointmentStatus
    {
        Scheduled = 1,      // Randevu planlandı - ödeme bekliyor
        Confirmed = 2,      // Onaylandı
        Completed = 3,      // Tamamlandı
        Cancelled = 4,      // İptal edildi
        NoShow = 5          // Gelmedi
    }
}