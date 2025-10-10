namespace BeautySalonAPI.DTOs.LaserSession
{
    public class UpdateLaserSessionDto
    {
        public DateTime? SessionDate { get; set; }
        public string BodyArea { get; set; } = string.Empty;
        public decimal EnergyJPerCm2 { get; set; }
        public int Pulse { get; set; }
        public decimal Speed { get; set; }
        public int Shots { get; set; }
        public string? Notes { get; set; }
        public int? SpecialistId { get; set; }
        
        // Optional appointment relation
        public int? AppointmentId { get; set; }
    }
}


