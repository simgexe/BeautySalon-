using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeautySalonAPI.Entities
{
    public class LaserSession
    {
        public int LaserSessionId { get; set; }

        // Optional relation to an Appointment
        public int? AppointmentId { get; set; }

        // Relations
        [Required(ErrorMessage = "Müşteri ID gereklidir")]
        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        public int? SpecialistId { get; set; }
        public User? Specialist { get; set; }

        // Session Info
        public DateTime? SessionDate { get; set; }

        [Required(ErrorMessage = "Uygulama bölgesi gereklidir")]
        [MaxLength(100, ErrorMessage = "Uygulama bölgesi en fazla 100 karakter olabilir")]
        [MinLength(2, ErrorMessage = "Uygulama bölgesi en az 2 karakter olmalıdır")]
        public string BodyArea { get; set; } = string.Empty; // Uygulama bölgesi

        [Required(ErrorMessage = "Enerji değeri (J/cm²) gereklidir")]
        [Range(0.1, 1000, ErrorMessage = "Enerji değeri 0.1 ile 1000 arasında olmalıdır")]
        [Column(TypeName = "decimal(10,2)")]
        public decimal EnergyJPerCm2 { get; set; } // J/cm²

        [Required(ErrorMessage = "Pulse değeri gereklidir")]
        [Range(1, 1000, ErrorMessage = "Pulse değeri 1 ile 1000 arasında olmalıdır")]
        public int Pulse { get; set; }

        [Required(ErrorMessage = "Hız değeri gereklidir")]
        [Range(0.1, 100, ErrorMessage = "Hız değeri 0.1 ile 100 arasında olmalıdır")]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Speed { get; set; } // Hız

        [Required(ErrorMessage = "Atış sayısı gereklidir")]
        [Range(1, 100000, ErrorMessage = "Atış sayısı 1 ile 100000 arasında olmalıdır")]
        public int Shots { get; set; } // Atış sayısı

        [MaxLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}


