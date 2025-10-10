using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.LaserSession;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        // Role-based filtering helper method
        private IQueryable<LaserSession> ApplyRoleBasedLaserFilter(IQueryable<LaserSession> query)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userRole == "Admin")
            {
                return query; // Admin sees all laser sessions
            }
            else if (userRole == "Specialist" && !string.IsNullOrEmpty(userId))
            {
                // Specialist sees only their own laser sessions
                return query.Where(ls => ls.SpecialistId == int.Parse(userId));
            }
            else
            {
                // Staff and other roles see no laser sessions
                return query.Where(ls => false);
            }
        }

        // GET: api/lasersessions/customer/{customerId}
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var exists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!exists) return NotFound("Customer not found");

            var query = _context.LaserSessions
                .Include(ls => ls.Specialist)
                .Where(ls => ls.CustomerId == customerId && ls.SessionDate.HasValue);

            var filteredQuery = ApplyRoleBasedLaserFilter(query);
            
            var sessions = await filteredQuery
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
                SpecialistName = ls.Specialist != null ? ($"{ls.Specialist.FirstName} {ls.Specialist.LastName}").Trim() : null,
                AppointmentId = ls.AppointmentId
            }).ToList();

            return Ok(dtos);
        }

        // GET: api/lasersessions/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var query = _context.LaserSessions
                .Include(x => x.Specialist)
                .Where(x => x.LaserSessionId == id);

            var filteredQuery = ApplyRoleBasedLaserFilter(query);
            var ls = await filteredQuery.FirstOrDefaultAsync();
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
                SpecialistName = ls.Specialist != null ? ($"{ls.Specialist.FirstName} {ls.Specialist.LastName}").Trim() : null,
                AppointmentId = ls.AppointmentId
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
                AppointmentId = dto.AppointmentId,
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
            entity.AppointmentId = dto.AppointmentId;
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

        // GET: api/lasersessions/customer/{customerId}/complete-info
        [HttpGet("customer/{customerId}/complete-info")]
        public async Task<IActionResult> GetCustomerCompleteInfo(int customerId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] GetCustomerCompleteInfo called for customerId: {customerId}");
                
                var customer = await _context.Customers
                    .Include(c => c.Appointments.Where(a => a.AppointmentDate.HasValue))
                        .ThenInclude(a => a.Specialist)
                    .FirstOrDefaultAsync(c => c.CustomerId == customerId);
                
                Console.WriteLine($"[DEBUG] Customer found: {customer != null}");
                if (customer != null)
                {
                    Console.WriteLine($"[DEBUG] Customer name: {customer.FullName}");
                    Console.WriteLine($"[DEBUG] Customer appointments count: {customer.Appointments?.Count ?? 0}");
                }
                
                if (customer == null) return NotFound("Customer not found");

                // Lazer kategorisini bul
                Console.WriteLine($"[DEBUG] Looking for laser category...");
                var laserCategory = await _context.ServiceCategories
                    .FirstOrDefaultAsync(c => c.CategoryName == "Lazer Epilasyon" || 
                                             c.CategoryName.ToLower().Contains("lazer") ||
                                             c.CategoryName.ToLower().Contains("epilasyon"));
                Console.WriteLine($"[DEBUG] Laser category found: {laserCategory != null}");

                // Müşterinin lazer randevularını getir
                Console.WriteLine($"[DEBUG] Getting laser appointments...");
                var laserAppointments = await _context.Appointments
                    .Include(a => a.Service)
                        .ThenInclude(s => s.Category)
                    .Include(a => a.Specialist)
                    .Where(a => a.CustomerId == customerId && 
                               a.AppointmentDate.HasValue &&
                               (laserCategory == null || a.Service.CategoryId == laserCategory.CategoryId))
                    .OrderByDescending(a => a.AppointmentDate)
                    .ToListAsync();
                Console.WriteLine($"[DEBUG] Found {laserAppointments.Count} laser appointments");

                // Lazer seanslarını getir
                Console.WriteLine($"[DEBUG] Getting laser sessions...");
                var laserSessions = await _context.LaserSessions
                    .Include(ls => ls.Specialist)
                    .Where(ls => ls.CustomerId == customerId && ls.SessionDate.HasValue)
                    .OrderByDescending(ls => ls.SessionDate)
                    .ToListAsync();
                Console.WriteLine($"[DEBUG] Found {laserSessions.Count} laser sessions");

                // Müşteri bilgileri
                Console.WriteLine($"[DEBUG] Creating customer info...");
                var customerInfo = new
                {
                    CustomerId = customer.CustomerId,
                    FullName = customer.FullName,
                    PhoneNumber = customer.PhoneNumber,
                    FirstAppointmentDate = customer.Appointments?.Where(a => a.AppointmentDate.HasValue).OrderBy(a => a.AppointmentDate).FirstOrDefault()?.AppointmentDate,
                    SpecialistName = customer.Appointments?
                        .Where(a => a.Specialist != null)
                        .OrderBy(a => a.AppointmentDate)
                        .Select(a => a.Specialist != null ? ($"{a.Specialist.FirstName} {a.Specialist.LastName}").Trim() : null)
                        .FirstOrDefault()
                };
                Console.WriteLine($"[DEBUG] Customer info created successfully");

                // Lazer randevuları
                var appointmentDtos = laserAppointments.Select(a => new
                {
                    AppointmentId = a.AppointmentId,
                    ServiceName = a.Service.ServiceName,
                    CategoryName = a.Service.Category?.CategoryName ?? string.Empty,
                    AppointmentDate = a.AppointmentDate,
                    SpecialistId = a.SpecialistId,
                    SpecialistName = a.Specialist != null ? ($"{a.Specialist.FirstName} {a.Specialist.LastName}").Trim() : null,
                    SpecialistPhone = a.Specialist?.PhoneNumber,
                    AgreedPrice = a.AgreedPrice,
                    Status = a.Status,
                    StatusDisplay = GetAppointmentStatusDisplay(a.Status)
                }).ToList();

                // Lazer seansları
                var sessionDtos = laserSessions.Select(s => new
                {
                    LaserSessionId = s.LaserSessionId,
                    SessionDate = s.SessionDate,
                    BodyArea = s.BodyArea,
                    EnergyJPerCm2 = s.EnergyJPerCm2,
                    Pulse = s.Pulse,
                    Speed = s.Speed,
                    Shots = s.Shots,
                    Notes = s.Notes,
                    SpecialistId = s.SpecialistId,
                    SpecialistName = s.Specialist != null ? ($"{s.Specialist.FirstName} {s.Specialist.LastName}").Trim() : null,
                    AppointmentId = s.AppointmentId
                }).ToList();

                var result = new
                {
                    CustomerInfo = customerInfo,
                    LaserAppointments = appointmentDtos,
                    LaserSessions = sessionDtos,
                    AppointmentCount = appointmentDtos.Count,
                    SessionCount = sessionDtos.Count
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log the error for debugging
                Console.WriteLine($"[ERROR] GetCustomerCompleteInfo for customer {customerId}: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    message = "Müşteri bilgileri yüklenirken hata oluştu", 
                    error = ex.Message,
                    customerId = customerId
                });
            }
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


