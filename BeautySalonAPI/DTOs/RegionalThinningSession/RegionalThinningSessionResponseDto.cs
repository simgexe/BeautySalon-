namespace BeautySalonAPI.DTOs.RegionalThinningSession
{
    public class RegionalThinningSessionResponseDto
    {
        public int RegionalThinningSessionId { get; set; }
        public int CustomerId { get; set; }
        public DateTime SessionDate { get; set; }
        public string BodyArea { get; set; } = string.Empty;
        public DateTime ContractDate { get; set; }
        
        // Bölgesel değerler (sayısal)
        public decimal? Belly { get; set; } // Göbek
        public decimal? RightArm { get; set; } // Sağ Kol
        public decimal? LeftArm { get; set; } // Sol Kol
        public decimal? RightLeg { get; set; } // Sağ Bacak
        public decimal? LeftLeg { get; set; } // Sol Bacak
        
        public string? Notes { get; set; }

        public int? SpecialistId { get; set; }
        public string? SpecialistName { get; set; }

        // Customer bilgileri
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
    }
}
