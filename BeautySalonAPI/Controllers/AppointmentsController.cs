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
                CategoryName = a.Service.Category?.CategoryName ?? string.Empty,
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
                CategoryName = appointment.Service.Category?.CategoryName ?? string.Empty,
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
                CategoryName = a.Service.Category?.CategoryName ?? string.Empty,
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
                CategoryName = a.Service.Category?.CategoryName ?? string.Empty,
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

        // Randevuyu tamamla ve seans kullan
        [HttpPost("{id}/complete-session")]
        public async Task<IActionResult> CompleteSession(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Service)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);

            if (appointment == null) return NotFound();

            if (appointment.RemainingSessions <= 0)
            {
                return BadRequest("Bu randevuda kullanılacak seans kalmamış");
            }

            // Seans kullan
            appointment.RemainingSessions--;
            
            // Eğer tüm seanslar bittiyse randevuyu tamamla
            if (appointment.RemainingSessions == 0)
            {
                appointment.Status = AppointmentStatus.Completed;
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Seans başarıyla kullanıldı",
                remainingSessions = appointment.RemainingSessions,
                isCompleted = appointment.RemainingSessions == 0
            });
        }

        // Randevu oluştururken seans bilgilerini otomatik ayarla
        [HttpPost]
        public async Task<IActionResult> Add(CreateAppointmentDto createDto)
        {
            // Servis bilgilerini al
            var service = await _context.Services.FindAsync(createDto.ServiceId);
            if (service == null) return NotFound("Service not found");

            // Müşteri var mı kontrol et
            var customer = await _context.Customers.FindAsync(createDto.CustomerId);
            if (customer == null) return NotFound("Customer not found");

            // Seans bilgilerini otomatik ayarla
            int totalSessions = createDto.TotalSessions;
            if (totalSessions <= 0)
            {
                // Eğer seans sayısı belirtilmemişse, servisin varsayılan seans sayısını kullan
                totalSessions = service.DefaultSessions;
            }

            // Manual mapping: DTO → Entity
            var appointment = new Appointment
            {
                CustomerId = createDto.CustomerId,
                ServiceId = createDto.ServiceId,
                AgreedPrice = createDto.AgreedPrice,
                TotalSessions = totalSessions,
                RemainingSessions = totalSessions, // Başlangıçta tüm seanslar kullanılabilir
                AppointmentDate = createDto.AppointmentDate,
                Status = AppointmentStatus.Scheduled
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Manual mapping: Entity → Response DTO
            var responseDto = new AppointmentResponseDto
            {
                AppointmentId = appointment.AppointmentId,
                CustomerId = appointment.CustomerId,
                CustomerName = customer.FullName,
                CustomerPhone = customer.PhoneNumber,
                ServiceId = appointment.ServiceId,
                ServiceName = service.ServiceName,
                CategoryName = service.Category?.CategoryName ?? string.Empty,
                AgreedPrice = appointment.AgreedPrice,
                TotalSessions = appointment.TotalSessions,
                RemainingSessions = appointment.RemainingSessions,
                AppointmentDate = appointment.AppointmentDate,
                Status = appointment.Status,
                StatusDisplay = GetAppointmentStatusDisplay(appointment.Status)
            };

            return Ok(responseDto);
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


            if (appointment.AppointmentDate != updateDto.AppointmentDate)
            {
                var conflictingAppointment = await _context.Appointments
                    .Where(a => a.AppointmentDate == updateDto.AppointmentDate &&
                               a.AppointmentId != id)
                    .FirstOrDefaultAsync();

                if (conflictingAppointment != null)
                {
                    if (conflictingAppointment.Status != AppointmentStatus.Cancelled)
                    {
                        return BadRequest("Bu saatte zaten başka bir randevu var");
                    }

                    // İptal edilmiş randevu var - sadece 1dk sonrasına izin ver
                    var oneMinuteAfter = conflictingAppointment.AppointmentDate.AddMinutes(1);
                    if (updateDto.AppointmentDate != oneMinuteAfter)
                    {
                        return BadRequest("İptal edilen randevuya aynı saate randevu alınamaz. Sadece 1 dakika sonrasına randevu alabilirsiniz");
                    }
                }

                // Update modunda geçmiş tarihlere izin ver 
            }

            // Eski status'u sakla
            var oldStatus = appointment.Status;

            // Manual mapping: DTO → Entity
            appointment.CustomerId = updateDto.CustomerId;
            appointment.ServiceId = updateDto.ServiceId;
            appointment.AgreedPrice = updateDto.AgreedPrice;
            appointment.TotalSessions = updateDto.TotalSessions;
            appointment.RemainingSessions = updateDto.RemainingSessions;
            appointment.AppointmentDate = updateDto.AppointmentDate;
            appointment.Status = updateDto.Status;

            // ÖDEME OTOMATIK İPTAL LOGİC'İ
            if (updateDto.Status == AppointmentStatus.Cancelled || updateDto.Status == AppointmentStatus.NoShow)
            {
                var pendingPayments = await _context.Payments
                    .Where(p => p.AppointmentId == id && p.Status == PaymentStatus.Pending)
                    .ToListAsync();

                foreach (var payment in pendingPayments)
                {
                    payment.Status = PaymentStatus.Cancelled;
                    payment.PaymentNotes = $"Randevu {GetAppointmentStatusDisplay(updateDto.Status)} - Otomatik iptal edildi.";
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        // Randevu durumunu güncelle

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatus status)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            var oldStatus = appointment.Status;
            appointment.Status = status;

            // Eğer randevu iptal veya gelmedi olursa, bekleyen ödemeleri iptal et
            if (status == AppointmentStatus.Cancelled || status == AppointmentStatus.NoShow)
            {
                var pendingPayments = await _context.Payments
                    .Where(p => p.AppointmentId == id && p.Status == PaymentStatus.Pending)
                    .ToListAsync();

                foreach (var payment in pendingPayments)
                {
                    payment.Status = PaymentStatus.Cancelled;
                    payment.PaymentNotes = $"Randevu {GetAppointmentStatusDisplay(status)} - Otomatik iptal edildi.";
                }

                // Console'a log bas
                if (pendingPayments.Any())
                {
                    Console.WriteLine($"[LOG] UpdateStatus: Randevu {id} durumu {GetAppointmentStatusDisplay(oldStatus)} -> {GetAppointmentStatusDisplay(status)} değiştirildi. {pendingPayments.Count} ödeme otomatik iptal edildi.");
                }
            }

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

            if (appointment.Status == AppointmentStatus.Cancelled)
            {
                return BadRequest("Appointment is already cancelled");
            }

            //  Randevu status'unu güncelle
            appointment.Status = AppointmentStatus.Cancelled;

            //  Bu randevuyla ilgili PENDING payment'ları da CANCELLED yap
            var pendingPayments = await _context.Payments
                .Where(p => p.AppointmentId == id && p.Status == PaymentStatus.Pending)
                .ToListAsync();

            foreach (var payment in pendingPayments)
            {
                payment.Status = PaymentStatus.Cancelled;
            }

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
        // Randevu "gelmedi" olarak işaretle (ödemeleri de güncelle)
        [HttpPut("{id}/noshow")]
        public async Task<IActionResult> MarkNoShow(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            if (appointment.Status == AppointmentStatus.NoShow)
            {
                return BadRequest("Appointment is already marked as no-show");
            }

            //  Randevu status'unu güncelle
            appointment.Status = AppointmentStatus.NoShow;

            //  Bu randevuyla ilgili PENDING payment'ları da CANCELLED yap
            var pendingPayments = await _context.Payments
                .Where(p => p.AppointmentId == id && p.Status == PaymentStatus.Pending)
                .ToListAsync();

            foreach (var payment in pendingPayments)
            {
                payment.Status = PaymentStatus.Cancelled;
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