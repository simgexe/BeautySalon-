using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.DTOs.Expense
{
    public class UpdateExpenseDto
    {
        [Required(ErrorMessage = "Açıklama gereklidir")]
        [StringLength(200, ErrorMessage = "Açıklama en fazla 200 karakter olabilir")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tutar gereklidir")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0'dan büyük olmalıdır")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Gider tarihi gereklidir")]
        public DateTime ExpenseDate { get; set; }

        [StringLength(100, ErrorMessage = "Kategori en fazla 100 karakter olabilir")]
        public string? Category { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }
}

