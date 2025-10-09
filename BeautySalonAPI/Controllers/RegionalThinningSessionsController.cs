using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.RegionalThinningSession;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegionalThinningSessionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RegionalThinningSessionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/regionalthinningsessions/customer/{customerId}
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var exists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!exists) return NotFound("Customer not found");

            var sessions = await _context.RegionalThinningSessions
                .Include(rts => rts.Specialist)
                .Include(rts => rts.Customer)
                .Where(rts => rts.CustomerId == customerId)
                .OrderByDescending(rts => rts.SessionDate)
                .ToListAsync();

            var dtos = sessions.Select(rts => new RegionalThinningSessionResponseDto
            {
                RegionalThinningSessionId = rts.RegionalThinningSessionId,
                CustomerId = rts.CustomerId,
                SessionDate = rts.SessionDate,
                BodyArea = rts.BodyArea,
                ContractDate = rts.ContractDate,
                Belly = rts.Belly,
                RightArm = rts.RightArm,
                LeftArm = rts.LeftArm,
                RightLeg = rts.RightLeg,
                LeftLeg = rts.LeftLeg,
                Notes = rts.Notes,
                SpecialistId = rts.SpecialistId,
                SpecialistName = rts.Specialist != null ? ($"{rts.Specialist.FirstName} {rts.Specialist.LastName}").Trim() : null,
                CustomerName = $"{rts.Customer.FirstName} {rts.Customer.LastName}".Trim(),
                CustomerPhone = rts.Customer.PhoneNumber
            }).ToList();

            return Ok(dtos);
        }

        // GET: api/regionalthinningsessions/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var rts = await _context.RegionalThinningSessions
                .Include(x => x.Specialist)
                .Include(x => x.Customer)
                .FirstOrDefaultAsync(x => x.RegionalThinningSessionId == id);
            
            if (rts == null) return NotFound();

            var dto = new RegionalThinningSessionResponseDto
            {
                RegionalThinningSessionId = rts.RegionalThinningSessionId,
                CustomerId = rts.CustomerId,
                SessionDate = rts.SessionDate,
                BodyArea = rts.BodyArea,
                ContractDate = rts.ContractDate,
                Belly = rts.Belly,
                RightArm = rts.RightArm,
                LeftArm = rts.LeftArm,
                RightLeg = rts.RightLeg,
                LeftLeg = rts.LeftLeg,
                Notes = rts.Notes,
                SpecialistId = rts.SpecialistId,
                SpecialistName = rts.Specialist != null ? ($"{rts.Specialist.FirstName} {rts.Specialist.LastName}").Trim() : null,
                CustomerName = $"{rts.Customer.FirstName} {rts.Customer.LastName}".Trim(),
                CustomerPhone = rts.Customer.PhoneNumber
            };

            return Ok(dto);
        }

        // GET: api/regionalthinningsessions
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sessions = await _context.RegionalThinningSessions
                .Include(rts => rts.Specialist)
                .Include(rts => rts.Customer)
                .OrderByDescending(rts => rts.SessionDate)
                .ToListAsync();

            var dtos = sessions.Select(rts => new RegionalThinningSessionResponseDto
            {
                RegionalThinningSessionId = rts.RegionalThinningSessionId,
                CustomerId = rts.CustomerId,
                SessionDate = rts.SessionDate,
                BodyArea = rts.BodyArea,
                ContractDate = rts.ContractDate,
                Belly = rts.Belly,
                RightArm = rts.RightArm,
                LeftArm = rts.LeftArm,
                RightLeg = rts.RightLeg,
                LeftLeg = rts.LeftLeg,
                Notes = rts.Notes,
                SpecialistId = rts.SpecialistId,
                SpecialistName = rts.Specialist != null ? ($"{rts.Specialist.FirstName} {rts.Specialist.LastName}").Trim() : null,
                CustomerName = $"{rts.Customer.FirstName} {rts.Customer.LastName}".Trim(),
                CustomerPhone = rts.Customer.PhoneNumber
            }).ToList();

            return Ok(dtos);
        }

        // POST: api/regionalthinningsessions
        [HttpPost]
        public async Task<IActionResult> Create(CreateRegionalThinningSessionDto dto)
        {
            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null) return NotFound("Customer not found");

            var entity = new RegionalThinningSession
            {
                CustomerId = dto.CustomerId,
                AppointmentId = dto.AppointmentId,
                SpecialistId = dto.SpecialistId,
                SessionDate = dto.SessionDate,
                BodyArea = dto.BodyArea,
                ContractDate = dto.ContractDate,
                Belly = dto.Belly,
                RightArm = dto.RightArm,
                LeftArm = dto.LeftArm,
                RightLeg = dto.RightLeg,
                LeftLeg = dto.LeftLeg,
                Notes = dto.Notes
            };

            _context.RegionalThinningSessions.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = entity.RegionalThinningSessionId }, new { entity.RegionalThinningSessionId });
        }

        // PUT: api/regionalthinningsessions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateRegionalThinningSessionDto dto)
        {
            var entity = await _context.RegionalThinningSessions.FindAsync(id);
            if (entity == null) return NotFound();

            entity.SessionDate = dto.SessionDate;
            entity.BodyArea = dto.BodyArea;
            entity.ContractDate = dto.ContractDate;
            entity.Belly = dto.Belly;
            entity.RightArm = dto.RightArm;
            entity.LeftArm = dto.LeftArm;
            entity.RightLeg = dto.RightLeg;
            entity.LeftLeg = dto.LeftLeg;
            entity.Notes = dto.Notes;
            entity.SpecialistId = dto.SpecialistId;
            entity.AppointmentId = dto.AppointmentId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/regionalthinningsessions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.RegionalThinningSessions.FindAsync(id);
            if (entity == null) return NotFound();
            
            _context.RegionalThinningSessions.Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/regionalthinningsessions/customer/{customerId}/complete-info
        [HttpGet("customer/{customerId}/complete-info")]
        public async Task<IActionResult> GetCustomerCompleteInfo(int customerId)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null) return NotFound("Customer not found");

            // Bölgesel incelme kategorisini bul
            var regionalThinningCategory = await _context.ServiceCategories
                .FirstOrDefaultAsync(c => c.CategoryName == "Bölgesel İncelme" || 
                                         c.CategoryName.ToLower().Contains("bölgesel") ||
                                         c.CategoryName.ToLower().Contains("incelme"));

            // Müşterinin bölgesel incelme randevularını getir
            var regionalThinningAppointments = await _context.Appointments
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .Include(a => a.Specialist)
                .Where(a => a.CustomerId == customerId && 
                           (regionalThinningCategory == null || a.Service.CategoryId == regionalThinningCategory.CategoryId))
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            // Bölgesel incelme seanslarını getir
            var regionalThinningSessions = await _context.RegionalThinningSessions
                .Include(rts => rts.Specialist)
                .Where(rts => rts.CustomerId == customerId)
                .OrderByDescending(rts => rts.SessionDate)
                .ToListAsync();

            // Müşteri bilgileri
            var customerInfo = new
            {
                CustomerId = customer.CustomerId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                FirstAppointmentDate = customer.Appointments.OrderBy(a => a.AppointmentDate).FirstOrDefault()?.AppointmentDate,
                SpecialistName = customer.Appointments
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => a.Specialist != null ? ($"{a.Specialist.FirstName} {a.Specialist.LastName}").Trim() : null)
                    .FirstOrDefault()
            };

            // Bölgesel incelme randevuları
            var appointmentDtos = regionalThinningAppointments.Select(a => new
            {
                AppointmentId = a.AppointmentId,
                ServiceName = a.Service.ServiceName,
                CategoryName = a.Service.Category?.CategoryName ?? string.Empty,
                AppointmentDate = a.AppointmentDate,
                SpecialistName = a.Specialist != null ? ($"{a.Specialist.FirstName} {a.Specialist.LastName}").Trim() : null,
                SpecialistPhone = a.Specialist?.PhoneNumber,
                AgreedPrice = a.AgreedPrice,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            // Bölgesel incelme seansları
            var sessionDtos = regionalThinningSessions.Select(s => new
            {
                RegionalThinningSessionId = s.RegionalThinningSessionId,
                SessionDate = s.SessionDate,
                BodyArea = s.BodyArea,
                ContractDate = s.ContractDate,
                Belly = s.Belly,
                RightArm = s.RightArm,
                LeftArm = s.LeftArm,
                RightLeg = s.RightLeg,
                LeftLeg = s.LeftLeg,
                Notes = s.Notes,
                SpecialistId = s.SpecialistId,
                SpecialistName = s.Specialist != null ? ($"{s.Specialist.FirstName} {s.Specialist.LastName}").Trim() : null
            }).ToList();

            var result = new
            {
                CustomerInfo = customerInfo,
                RegionalThinningAppointments = appointmentDtos,
                RegionalThinningSessions = sessionDtos,
                AppointmentCount = appointmentDtos.Count,
                SessionCount = sessionDtos.Count
            };

            return Ok(result);
        }

        // Helper metodlar
        private string GetAppointmentStatusDisplay(AppointmentStatus status)
        {
            return status switch
            {
                AppointmentStatus.Scheduled => "Planlandı",
                AppointmentStatus.Confirmed => "Onaylandı",
                AppointmentStatus.Completed => "Tamamlandı",
                AppointmentStatus.Cancelled => "İptal",
                AppointmentStatus.NoShow => "Gelmedi",
                _ => status.ToString()
            };
        }
    }
}