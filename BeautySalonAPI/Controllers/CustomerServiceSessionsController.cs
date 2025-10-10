using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.CustomerServiceSession;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerServiceSessionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerServiceSessionsController(AppDbContext context)
        {
            _context = context;
        }

        // Role-based filtering helper method
        private IQueryable<CustomerServiceSession> ApplyRoleBasedSessionFilter(IQueryable<CustomerServiceSession> query)
        {
            // Everyone can see all sessions - filtering is done on frontend for edit/delete permissions
            return query;
        }

        // Tüm seans paketlerini getir
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Get all sessions - everyone can see all sessions
            var sessions = await _context.CustomerServiceSessions
                .Include(css => css.Customer)
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .OrderByDescending(css => css.CreatedDate)
                .ToListAsync();

            var sessionDtos = sessions.Select(s => new CustomerServiceSessionDto
            {
                CustomerServiceSessionId = s.CustomerServiceSessionId,
                CustomerId = s.CustomerId,
                CustomerName = s.Customer.FullName,
                ServiceId = s.ServiceId,
                ServiceName = s.Service.ServiceName,
                CategoryName = s.Service.Category?.CategoryName ?? string.Empty,
                TotalSessions = s.TotalSessions,
                RemainingSessions = s.RemainingSessions,
                CreatedDate = s.CreatedDate,
                CompletedDate = s.CompletedDate,
                IsActive = s.IsActive
            }).ToList();

            return Ok(sessionDtos);
        }

        // Belirli seans paketini getir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var session = await _context.CustomerServiceSessions
                .Include(css => css.Customer)
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Include(css => css.Appointments)
                .FirstOrDefaultAsync(css => css.CustomerServiceSessionId == id);

            if (session == null) return NotFound();

            var sessionDto = new CustomerServiceSessionDto
            {
                CustomerServiceSessionId = session.CustomerServiceSessionId,
                CustomerId = session.CustomerId,
                CustomerName = session.Customer.FullName,
                ServiceId = session.ServiceId,
                ServiceName = session.Service.ServiceName,
                CategoryName = session.Service.Category?.CategoryName ?? string.Empty,
                TotalSessions = session.TotalSessions,
                RemainingSessions = session.RemainingSessions,
                CreatedDate = session.CreatedDate,
                CompletedDate = session.CompletedDate,
                IsActive = session.IsActive
            };

            return Ok(sessionDto);
        }

        // Müşterinin seans paketlerini getir
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!customerExists) return NotFound("Customer not found");

            var sessions = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Where(css => css.CustomerId == customerId)
                .OrderByDescending(css => css.CreatedDate)
                .ToListAsync();

            var sessionDtos = sessions.Select(s => new CustomerServiceSessionDto
            {
                CustomerServiceSessionId = s.CustomerServiceSessionId,
                CustomerId = s.CustomerId,
                ServiceId = s.ServiceId,
                ServiceName = s.Service.ServiceName,
                CategoryName = s.Service.Category?.CategoryName ?? string.Empty,
                TotalSessions = s.TotalSessions,
                RemainingSessions = s.RemainingSessions,
                CreatedDate = s.CreatedDate,
                CompletedDate = s.CompletedDate,
                IsActive = s.IsActive
            }).ToList();

            return Ok(sessionDtos);
        }

        // Müşterinin aktif seans paketlerini getir
        [HttpGet("customer/{customerId}/active")]
        public async Task<IActionResult> GetActiveByCustomer(int customerId)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!customerExists) return NotFound("Customer not found");

            var sessions = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Where(css => css.CustomerId == customerId && css.IsActive)
                .OrderBy(css => css.CreatedDate)
                .ToListAsync();

            var sessionDtos = sessions.Select(s => new CustomerServiceSessionDto
            {
                CustomerServiceSessionId = s.CustomerServiceSessionId,
                CustomerId = s.CustomerId,
                ServiceId = s.ServiceId,
                ServiceName = s.Service.ServiceName,
                CategoryName = s.Service.Category?.CategoryName ?? string.Empty,
                TotalSessions = s.TotalSessions,
                RemainingSessions = s.RemainingSessions,
                CreatedDate = s.CreatedDate,
                CompletedDate = s.CompletedDate,
                IsActive = s.IsActive
            }).ToList();

            return Ok(sessionDtos);
        }

        // Yeni seans paketi oluştur (manuel)
        [HttpPost]
        public async Task<IActionResult> Create(CreateCustomerServiceSessionDto createDto)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Only Admin and Specialist can create sessions
            if (userRole != "Admin" && userRole != "Specialist")
            {
                return Forbid("Only Admin and Specialist users can create sessions");
            }

            // Müşteri var mı kontrol et
            var customer = await _context.Customers.FindAsync(createDto.CustomerId);
            if (customer == null) return NotFound("Customer not found");

            // Servis var mı kontrol et
            var service = await _context.Services.FindAsync(createDto.ServiceId);
            if (service == null) return NotFound("Service not found");

            // Specialist can only create sessions for their categories
            if (userRole == "Specialist" && !string.IsNullOrEmpty(userId))
            {
                var userServiceCategories = await _context.UserServiceCategories
                    .Where(usc => usc.UserId == int.Parse(userId))
                    .Select(usc => usc.ServiceCategoryId)
                    .ToListAsync();

                if (!userServiceCategories.Contains(service.CategoryId))
                {
                    return Forbid("You can only create sessions for your assigned service categories");
                }
            }

            // Bu müşteri-servis kombinasyonu için aktif seans paketi var mı kontrol et
            var existingActiveSession = await _context.CustomerServiceSessions
                .FirstOrDefaultAsync(css => css.CustomerId == createDto.CustomerId && 
                                          css.ServiceId == createDto.ServiceId && 
                                          css.IsActive);

            if (existingActiveSession != null)
            {
                return BadRequest("Bu müşteri için bu serviste zaten aktif bir seans paketi var");
            }

            var session = new CustomerServiceSession
            {
                CustomerId = createDto.CustomerId,
                ServiceId = createDto.ServiceId,
                TotalSessions = createDto.TotalSessions,
                RemainingSessions = createDto.TotalSessions,
                CreatedDate = DateTime.Now,
                IsActive = true
            };

            _context.CustomerServiceSessions.Add(session);
            await _context.SaveChangesAsync();

            var responseDto = new CustomerServiceSessionDto
            {
                CustomerServiceSessionId = session.CustomerServiceSessionId,
                CustomerId = session.CustomerId,
                CustomerName = customer.FullName,
                ServiceId = session.ServiceId,
                ServiceName = service.ServiceName,
                TotalSessions = session.TotalSessions,
                RemainingSessions = session.RemainingSessions,
                CreatedDate = session.CreatedDate,
                IsActive = session.IsActive
            };

            return CreatedAtAction(nameof(GetById), new { id = session.CustomerServiceSessionId }, responseDto);
        }

        // Seans paketini güncelle
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateCustomerServiceSessionDto updateDto)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Only Admin and Specialist can update sessions
            if (userRole != "Admin" && userRole != "Specialist")
            {
                return Forbid("Only Admin and Specialist users can update sessions");
            }

            var session = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                .FirstOrDefaultAsync(css => css.CustomerServiceSessionId == id);
            if (session == null) return NotFound();

            // Specialist can only update sessions from their categories
            if (userRole == "Specialist" && !string.IsNullOrEmpty(userId))
            {
                var userServiceCategories = await _context.UserServiceCategories
                    .Where(usc => usc.UserId == int.Parse(userId))
                    .Select(usc => usc.ServiceCategoryId)
                    .ToListAsync();

                if (!userServiceCategories.Contains(session.Service.CategoryId))
                {
                    return Forbid("You can only update sessions from your assigned service categories");
                }
            }

            session.RemainingSessions = updateDto.RemainingSessions;
            session.IsActive = updateDto.IsActive;
            session.CompletedDate = updateDto.CompletedDate;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Seans paketini tamamla
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var session = await _context.CustomerServiceSessions.FindAsync(id);
            if (session == null) return NotFound();

            if (!session.IsActive)
            {
                return BadRequest("Bu seans paketi zaten tamamlanmış");
            }

            session.IsActive = false;
            session.CompletedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Seans paketini sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Only Admin and Specialist can delete sessions
            if (userRole != "Admin" && userRole != "Specialist")
            {
                return Forbid("Only Admin and Specialist users can delete sessions");
            }

            var session = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                .FirstOrDefaultAsync(css => css.CustomerServiceSessionId == id);
            if (session == null) return NotFound();

            // Specialist can only delete sessions from their categories
            if (userRole == "Specialist" && !string.IsNullOrEmpty(userId))
            {
                var userServiceCategories = await _context.UserServiceCategories
                    .Where(usc => usc.UserId == int.Parse(userId))
                    .Select(usc => usc.ServiceCategoryId)
                    .ToListAsync();

                if (!userServiceCategories.Contains(session.Service.CategoryId))
                {
                    return Forbid("You can only delete sessions from your assigned service categories");
                }
            }

            // İlişkili randevular var mı kontrol et
            var hasAppointments = await _context.Appointments.AnyAsync(a => a.CustomerServiceSessionId == id);
            if (hasAppointments)
            {
                return BadRequest("Cannot delete session with existing appointments");
            }

            _context.CustomerServiceSessions.Remove(session);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
