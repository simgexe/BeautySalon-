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
    }
}