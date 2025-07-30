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
        Pending = 1,
        Paid = 2,
        Cancelled = 3,
        Refunded = 4
    }

    public enum AppointmentStatus
    {
        Scheduled = 1,
        Confirmed = 2,
        Completed = 3,
        Cancelled = 4,
        NoShow = 5
    }
}