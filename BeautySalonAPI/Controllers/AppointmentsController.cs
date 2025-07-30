using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.Appointment;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AppointmentsController(AppDbContext context)
        {
            _context = context;
        }

        // Tüm randevuları getir
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer.FullName,
                CustomerPhone = a.Customer.PhoneNumber,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                CategoryName = a.Service.Category?.CategoryName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            return Ok(appointmentDtos);
        }

        // Belirli randevuyu getir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);

            if (appointment == null) return NotFound();

            var appointmentDto = new AppointmentResponseDto
            {
                AppointmentId = appointment.AppointmentId,
                CustomerId = appointment.CustomerId,
                CustomerName = appointment.Customer.FullName,
                CustomerPhone = appointment.Customer.PhoneNumber,
                ServiceId = appointment.ServiceId,
                ServiceName = appointment.Service.ServiceName,
                CategoryName = appointment.Service.Category?.CategoryName,
                AgreedPrice = appointment.AgreedPrice,
                TotalSessions = appointment.TotalSessions,
                RemainingSessions = appointment.RemainingSessions,
                AppointmentDate = appointment.AppointmentDate,
                Status = appointment.Status,
                StatusDisplay = GetAppointmentStatusDisplay(appointment.Status)
            };

            return Ok(appointmentDto);
        }

        // Takvim görünümü için optimize edilmiş endpoint
        [HttpGet("calendar")]
        public async Task<IActionResult> GetCalendarView([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.Now.AddMonths(-1);
            var end = endDate ?? DateTime.Now.AddMonths(1);

            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            var calendarDtos = appointments.Select(a => new AppointmentCalendarDto
            {
                AppointmentId = a.AppointmentId,
                CustomerName = a.Customer.FullName,
                ServiceName = a.Service.ServiceName,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status
            }).ToList();

            return Ok(calendarDtos);
        }

        // Belirli tarih aralığındaki randevuları getir
        [HttpGet("by-date-range")]
        public async Task<IActionResult> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .Where(a => a.AppointmentDate.Date >= startDate.Date && a.AppointmentDate.Date <= endDate.Date)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer.FullName,
                CustomerPhone = a.Customer.PhoneNumber,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                CategoryName = a.Service.Category?.CategoryName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            return Ok(appointmentDtos);
        }

        // Belirli müşterinin randevularını getir
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetCustomerAppointments(int customerId)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!customerExists) return NotFound("Customer not found");

            var appointments = await _context.Appointments
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .Where(a => a.CustomerId == customerId)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                CategoryName = a.Service.Category?.CategoryName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            return Ok(appointmentDtos);
        }

        // Bugünün randevularını getir
        [HttpGet("today")]
        public async Task<IActionResult> GetTodaysAppointments()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer.FullName,
                CustomerPhone = a.Customer.PhoneNumber,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            return Ok(appointmentDtos);
        }

        // Yaklaşan randevuları getir
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingAppointments([FromQuery] int days = 7)
        {
            var startDate = DateTime.Now;
            var endDate = startDate.AddDays(days);

            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                .Where(a => a.AppointmentDate >= startDate && a.AppointmentDate <= endDate)
                .Where(a => a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.Confirmed)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer.FullName,
                CustomerPhone = a.Customer.PhoneNumber,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            return Ok(appointmentDtos);
        }

        // Duruma göre randevuları getir
        [HttpGet("by-status/{status}")]
        public async Task<IActionResult> GetByStatus(AppointmentStatus status)
        {
            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                .Where(a => a.Status == status)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer.FullName,
                CustomerPhone = a.Customer.PhoneNumber,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
                AppointmentDate = a.AppointmentDate,
                Status = a.Status,
                StatusDisplay = GetAppointmentStatusDisplay(a.Status)
            }).ToList();

            return Ok(appointmentDtos);
        }

        // Yeni randevu oluştur
        [HttpPost]
        public async Task<IActionResult> Create(CreateAppointmentDto createDto)
        {
            // Müşteri var mı kontrol et
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == createDto.CustomerId);
            if (!customerExists)
            {
                return BadRequest("Customer not found");
            }

            // Hizmet var mı kontrol et
            var serviceExists = await _context.Services.AnyAsync(s => s.ServiceId == createDto.ServiceId);
            if (!serviceExists)
            {
                return BadRequest("Service not found");
            }

            // Çakışan randevu var mı kontrol et
            var conflictingAppointment = await _context.Appointments
                .AnyAsync(a => a.AppointmentDate == createDto.AppointmentDate &&
                          a.Status != AppointmentStatus.Cancelled);

            if (conflictingAppointment)
            {
                return BadRequest("There is already an appointment at this time");
            }

            // Manual mapping: DTO → Entity
            var appointment = new Appointment
            {
                CustomerId = createDto.CustomerId,
                ServiceId = createDto.ServiceId,
                AgreedPrice = createDto.AgreedPrice,
                TotalSessions = createDto.TotalSessions,
                RemainingSessions = createDto.TotalSessions, // Başlangıçta toplam seansa eşit
                AppointmentDate = createDto.AppointmentDate,
                Status = AppointmentStatus.Scheduled // Default durum
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // İlişkili verileri al response için
            var appointmentWithIncludes = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointment.AppointmentId);

            if (appointmentWithIncludes == null)
            {
                return StatusCode(500, "Appointment could not be loaded after creation.");
            }

            // Manual mapping: Entity → Response DTO
            var responseDto = new AppointmentResponseDto
            {
                AppointmentId = appointmentWithIncludes.AppointmentId,
                CustomerId = appointmentWithIncludes.CustomerId,
                CustomerName = appointmentWithIncludes.Customer.FullName,
                CustomerPhone = appointmentWithIncludes.Customer.PhoneNumber,
                ServiceId = appointmentWithIncludes.ServiceId,
                ServiceName = appointmentWithIncludes.Service.ServiceName,
                CategoryName = appointmentWithIncludes.Service.Category?.CategoryName,
                AgreedPrice = appointmentWithIncludes.AgreedPrice,
                TotalSessions = appointmentWithIncludes.TotalSessions,
                RemainingSessions = appointmentWithIncludes.RemainingSessions,
                AppointmentDate = appointmentWithIncludes.AppointmentDate,
                Status = appointmentWithIncludes.Status,
                StatusDisplay = GetAppointmentStatusDisplay(appointmentWithIncludes.Status)
            };

            return CreatedAtAction(nameof(GetById), new { id = appointment.AppointmentId }, responseDto);
        }

        // Randevu güncelle
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateAppointmentDto updateDto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            // Müşteri var mı kontrol et
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == updateDto.CustomerId);
            if (!customerExists)
            {
                return BadRequest("Customer not found");
            }

            // Hizmet var mı kontrol et
            var serviceExists = await _context.Services.AnyAsync(s => s.ServiceId == updateDto.ServiceId);
            if (!serviceExists)
            {
                return BadRequest("Service not found");
            }

            // Tarih değişiyorsa çakışma kontrolü
            if (appointment.AppointmentDate != updateDto.AppointmentDate)
            {
                var conflictingAppointment = await _context.Appointments
                    .AnyAsync(a => a.AppointmentDate == updateDto.AppointmentDate &&
                              a.AppointmentId != id &&
                              a.Status != AppointmentStatus.Cancelled);

                if (conflictingAppointment)
                {
                    return BadRequest("There is already an appointment at this time");
                }
            }

            // Manual mapping: DTO → Entity
            appointment.CustomerId = updateDto.CustomerId;
            appointment.ServiceId = updateDto.ServiceId;
            appointment.AgreedPrice = updateDto.AgreedPrice;
            appointment.TotalSessions = updateDto.TotalSessions;
            appointment.RemainingSessions = updateDto.RemainingSessions;
            appointment.AppointmentDate = updateDto.AppointmentDate;
            appointment.Status = updateDto.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Randevu durumunu güncelle
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatus status)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.Status = status;

            // Eğer randevu tamamlandıysa, kalan seans sayısını azalt
            if (status == AppointmentStatus.Completed && appointment.RemainingSessions > 0)
            {
                appointment.RemainingSessions--;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Randevu sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            // İlişkili ödemeler var mı kontrol et
            var hasPayments = await _context.Payments.AnyAsync(p => p.AppointmentId == id);
            if (hasPayments)
            {
                return BadRequest("Cannot delete appointment with existing payments");
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Randevu iptal et (soft delete)
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.Status = AppointmentStatus.Cancelled;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Randevu onayla
        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            if (appointment.Status != AppointmentStatus.Scheduled)
            {
                return BadRequest("Only scheduled appointments can be confirmed");
            }

            appointment.Status = AppointmentStatus.Confirmed;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Randevu tamamla
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            if (appointment.Status != AppointmentStatus.Confirmed && appointment.Status != AppointmentStatus.Scheduled)
            {
                return BadRequest("Only confirmed or scheduled appointments can be completed");
            }

            appointment.Status = AppointmentStatus.Completed;

            // Kalan seans sayısını azalt
            if (appointment.RemainingSessions > 0)
            {
                appointment.RemainingSessions--;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Helper metodlar - enum'ları display string'e çevir
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