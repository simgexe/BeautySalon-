namespace BeautySalonAPI.DTOs.LaserSession
{
    public class LaserSessionResponseDto
    {
        public int LaserSessionId { get; set; }
        public int CustomerId { get; set; }
        public DateTime SessionDate { get; set; }
        public string BodyArea { get; set; } = string.Empty;
        public decimal EnergyJPerCm2 { get; set; }
        public int Pulse { get; set; }
        public decimal Speed { get; set; }
        public int Shots { get; set; }
        public string? Notes { get; set; }

        public int? SpecialistId { get; set; }
        public string? SpecialistName { get; set; }
    }
}


