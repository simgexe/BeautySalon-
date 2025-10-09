using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeautySalonAPI.Entities
{
    public class RegionalThinningSession
    {
        public int RegionalThinningSessionId { get; set; }

        // Optional relation to an Appointment (not all appointments are regional thinning)
        public int? AppointmentId { get; set; }

        // Relations
        [Required(ErrorMessage = "Müşteri ID gereklidir")]
        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        public int? SpecialistId { get; set; }
        public User? Specialist { get; set; }

        // Session Info
        [Required(ErrorMessage = "Seans tarihi gereklidir")]
        public DateTime SessionDate { get; set; }

        [Required(ErrorMessage = "Uygulama bölgesi gereklidir")]
        [MaxLength(100, ErrorMessage = "Uygulama bölgesi en fazla 100 karakter olabilir")]
        public string BodyArea { get; set; } = string.Empty; // String olarak uygulama bölgesi

        [Required(ErrorMessage = "Sözleşme tarihi gereklidir")]
        public DateTime ContractDate { get; set; }

        // Bölgesel değerler (sayısal)
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Belly { get; set; } // Göbek

        [Column(TypeName = "decimal(10,2)")]
        public decimal? RightArm { get; set; } // Sağ Kol

        [Column(TypeName = "decimal(10,2)")]
        public decimal? LeftArm { get; set; } // Sol Kol

        [Column(TypeName = "decimal(10,2)")]
        public decimal? RightLeg { get; set; } // Sağ Bacak

        [Column(TypeName = "decimal(10,2)")]
        public decimal? LeftLeg { get; set; } // Sol Bacak

        [MaxLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
