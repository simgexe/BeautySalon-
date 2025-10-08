using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.LaserSession;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LaserSessionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LaserSessionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/lasersessions/customer/{customerId}
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var exists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!exists) return NotFound("Customer not found");

            var sessions = await _context.LaserSessions
                .Include(ls => ls.Specialist)
                .Where(ls => ls.CustomerId == customerId)
                .OrderByDescending(ls => ls.SessionDate)
                .ToListAsync();

            var dtos = sessions.Select(ls => new LaserSessionResponseDto
            {
                LaserSessionId = ls.LaserSessionId,
                CustomerId = ls.CustomerId,
                SessionDate = ls.SessionDate,
                BodyArea = ls.BodyArea,
                EnergyJPerCm2 = ls.EnergyJPerCm2,
                Pulse = ls.Pulse,
                Speed = ls.Speed,
                Shots = ls.Shots,
                Notes = ls.Notes,
                SpecialistId = ls.SpecialistId,
                SpecialistName = ls.Specialist != null ? ($"{ls.Specialist.FirstName} {ls.Specialist.LastName}").Trim() : null
            }).ToList();

            return Ok(dtos);
        }

        // GET: api/lasersessions/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var ls = await _context.LaserSessions.Include(x => x.Specialist).FirstOrDefaultAsync(x => x.LaserSessionId == id);
            if (ls == null) return NotFound();
            var dto = new LaserSessionResponseDto
            {
                LaserSessionId = ls.LaserSessionId,
                CustomerId = ls.CustomerId,
                SessionDate = ls.SessionDate,
                BodyArea = ls.BodyArea,
                EnergyJPerCm2 = ls.EnergyJPerCm2,
                Pulse = ls.Pulse,
                Speed = ls.Speed,
                Shots = ls.Shots,
                Notes = ls.Notes,
                SpecialistId = ls.SpecialistId,
                SpecialistName = ls.Specialist != null ? ($"{ls.Specialist.FirstName} {ls.Specialist.LastName}").Trim() : null
            };
            return Ok(dto);
        }

        // POST: api/lasersessions
        [HttpPost]
        public async Task<IActionResult> Create(CreateLaserSessionDto dto)
        {
            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null) return NotFound("Customer not found");

            var entity = new LaserSession
            {
                CustomerId = dto.CustomerId,
                SpecialistId = dto.SpecialistId,
                SessionDate = dto.SessionDate,
                BodyArea = dto.BodyArea,
                EnergyJPerCm2 = dto.EnergyJPerCm2,
                Pulse = dto.Pulse,
                Speed = dto.Speed,
                Shots = dto.Shots,
                Notes = dto.Notes
            };

            _context.LaserSessions.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = entity.LaserSessionId }, new { entity.LaserSessionId });
        }

        // PUT: api/lasersessions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateLaserSessionDto dto)
        {
            var entity = await _context.LaserSessions.FindAsync(id);
            if (entity == null) return NotFound();

            entity.SessionDate = dto.SessionDate;
            entity.BodyArea = dto.BodyArea;
            entity.EnergyJPerCm2 = dto.EnergyJPerCm2;
            entity.Pulse = dto.Pulse;
            entity.Speed = dto.Speed;
            entity.Shots = dto.Shots;
            entity.Notes = dto.Notes;
            entity.SpecialistId = dto.SpecialistId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/lasersessions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.LaserSessions.FindAsync(id);
            if (entity == null) return NotFound();
            _context.LaserSessions.Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


