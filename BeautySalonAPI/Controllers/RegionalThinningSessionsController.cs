using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.RegionalThinningSession;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        // Role-based filtering helper method
        private IQueryable<RegionalThinningSession> ApplyRoleBasedRegionalFilter(IQueryable<RegionalThinningSession> query)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userRole == "Admin")
            {
                return query; // Admin sees all regional thinning sessions
            }
            else if (userRole == "Specialist" && !string.IsNullOrEmpty(userId))
            {
                // Specialist sees only their own regional thinning sessions
                return query.Where(rts => rts.SpecialistId == int.Parse(userId));
            }
            else
            {
                // Staff and other roles see no regional thinning sessions
                return query.Where(rts => false);
            }
        }

        // GET: api/regionalthinningsessions/customer/{customerId}
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var exists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!exists) return NotFound("Customer not found");

            var query = _context.RegionalThinningSessions
                .Include(rts => rts.Specialist)
                .Include(rts => rts.Customer)
                .Where(rts => rts.CustomerId == customerId);

            var filteredQuery = ApplyRoleBasedRegionalFilter(query);
            
            var sessions = await filteredQuery
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

                // Bölgesel incelme kategorisini bul
                Console.WriteLine($"[DEBUG] Looking for regional thinning category...");
                var regionalThinningCategory = await _context.ServiceCategories
                    .FirstOrDefaultAsync(c => c.CategoryName == "Bölgesel İncelme" || 
                                             c.CategoryName.ToLower().Contains("bölgesel") ||
                                             c.CategoryName.ToLower().Contains("incelme"));
                Console.WriteLine($"[DEBUG] Regional thinning category found: {regionalThinningCategory != null}");

                // Müşterinin bölgesel incelme randevularını getir
                Console.WriteLine($"[DEBUG] Getting regional thinning appointments...");
                var regionalThinningAppointments = await _context.Appointments
                    .Include(a => a.Service)
                        .ThenInclude(s => s.Category)
                    .Include(a => a.Specialist)
                    .Where(a => a.CustomerId == customerId && 
                               a.AppointmentDate.HasValue &&
                               (regionalThinningCategory == null || a.Service.CategoryId == regionalThinningCategory.CategoryId))
                    .OrderByDescending(a => a.AppointmentDate)
                    .ToListAsync();
                Console.WriteLine($"[DEBUG] Found {regionalThinningAppointments.Count} regional thinning appointments");

                // Bölgesel incelme seanslarını getir
                Console.WriteLine($"[DEBUG] Getting regional thinning sessions...");
                var regionalThinningSessions = await _context.RegionalThinningSessions
                    .Include(rts => rts.Specialist)
                    .Where(rts => rts.CustomerId == customerId && rts.SessionDate.HasValue)
                    .OrderByDescending(rts => rts.SessionDate)
                    .ToListAsync();
                Console.WriteLine($"[DEBUG] Found {regionalThinningSessions.Count} regional thinning sessions");

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

                // Bölgesel incelme randevuları
                var appointmentDtos = regionalThinningAppointments.Select(a => new
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