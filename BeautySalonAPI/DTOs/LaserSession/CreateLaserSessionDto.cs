namespace BeautySalonAPI.DTOs.LaserSession
{
    public class CreateLaserSessionDto
    {
        public int CustomerId { get; set; }
        public int? SpecialistId { get; set; }
        public DateTime SessionDate { get; set; }
        public string BodyArea { get; set; } = string.Empty;
        public decimal EnergyJPerCm2 { get; set; }
        public int Pulse { get; set; }
        public decimal Speed { get; set; }
        public int Shots { get; set; }
        public string? Notes { get; set; }
    }
}


