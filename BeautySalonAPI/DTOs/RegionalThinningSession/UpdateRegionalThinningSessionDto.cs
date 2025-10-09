using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.DTOs.RegionalThinningSession
{
    public class UpdateRegionalThinningSessionDto
    {
        [Required(ErrorMessage = "Seans tarihi gereklidir")]
        public DateTime SessionDate { get; set; }

        [Required(ErrorMessage = "Uygulama bölgesi gereklidir")]
        [MaxLength(100, ErrorMessage = "Uygulama bölgesi en fazla 100 karakter olabilir")]
        public string BodyArea { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sözleşme tarihi gereklidir")]
        public DateTime ContractDate { get; set; }

        // Bölgesel değerler (sayısal)
        public decimal? Belly { get; set; } // Göbek
        public decimal? RightArm { get; set; } // Sağ Kol
        public decimal? LeftArm { get; set; } // Sol Kol
        public decimal? RightLeg { get; set; } // Sağ Bacak
        public decimal? LeftLeg { get; set; } // Sol Bacak

        [MaxLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }

        public int? SpecialistId { get; set; }
        
        // Optional appointment relation
        public int? AppointmentId { get; set; }
    }
}
