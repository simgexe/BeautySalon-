namespace BeautySalonAPI.DTOs.Expense
{
    public class ExpenseSummaryDto
    {
        public int ExpenseId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime ExpenseDate { get; set; }
        public string? Category { get; set; }
    }
}

