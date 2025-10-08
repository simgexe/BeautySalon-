using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.Appointment;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AppointmentsController(AppDbContext context)
        {
            _context = context;
        }

        // Tüm randevuları getir (Rol bazlı filtreleme)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var query = _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .Include(a => a.CustomerServiceSession)
                .AsQueryable();

            // Rol bazlı filtreleme
            query = ApplyRoleBasedFilter(query);

            var appointments = await query
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
                CustomerServiceSessionId = a.CustomerServiceSessionId,
                TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = a.CustomerServiceSession != null ? 
                    a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
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
                CustomerServiceSessionId = appointment.CustomerServiceSessionId,
                TotalSessions = appointment.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = appointment.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = appointment.CustomerServiceSession != null ? 
                    appointment.CustomerServiceSession.TotalSessions - appointment.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
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
                CustomerServiceSessionId = a.CustomerServiceSessionId,
                TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = a.CustomerServiceSession != null ? 
                    a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
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
                CustomerServiceSessionId = a.CustomerServiceSessionId,
                TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = a.CustomerServiceSession != null ? 
                    a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
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
                CustomerServiceSessionId = a.CustomerServiceSessionId,
                TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = a.CustomerServiceSession != null ? 
                    a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
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
                CustomerServiceSessionId = a.CustomerServiceSessionId,
                TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = a.CustomerServiceSession != null ? 
                    a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
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
                CustomerServiceSessionId = a.CustomerServiceSessionId,
                TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                UsedSessions = a.CustomerServiceSession != null ? 
                    a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
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
                .Include(a => a.CustomerServiceSession)
                .Include(a => a.Service)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);

            if (appointment == null) return NotFound();

            if (appointment.CustomerServiceSession == null)
            {
                return BadRequest("Bu randevu için seans paketi bulunamadı");
            }

            var session = appointment.CustomerServiceSession;

            if (session.RemainingSessions <= 0)
            {
                return BadRequest("Bu seans paketinde kullanılacak seans kalmamış");
            }

            // Seans kullan
            session.RemainingSessions--;
            appointment.Status = AppointmentStatus.Completed;
            
            // Eğer tüm seanslar bittiyse seans paketini tamamla
            if (session.RemainingSessions == 0)
            {
                session.IsActive = false;
                session.CompletedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Seans başarıyla kullanıldı",
                remainingSessions = session.RemainingSessions,
                isSessionCompleted = session.RemainingSessions == 0,
                totalSessions = session.TotalSessions,
                usedSessions = session.TotalSessions - session.RemainingSessions
            });
        }

        // Randevu oluştururken seans bilgilerini otomatik ayarla
        [HttpPost]
        public async Task<IActionResult> Add(CreateAppointmentDto createDto)
        {
            // Servis bilgilerini al
            var service = await _context.Services
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.ServiceId == createDto.ServiceId);
            if (service == null) return NotFound("Service not found");

            // Yetki kontrolü: Kullanıcı bu kategoriye randevu ekleyebilir mi?
            var (canAdd, allowedCategories) = await GetUserAppointmentPermissions();
            if (!canAdd || !allowedCategories.Contains(service.CategoryId))
            {
                return Forbid(); // 403 Forbidden
            }

            // Müşteri var mı kontrol et
            var customer = await _context.Customers.FindAsync(createDto.CustomerId);
            if (customer == null) return NotFound("Customer not found");

            // Müşteri-servis kombinasyonu için aktif seans paketi var mı kontrol et
            var activeSession = await _context.CustomerServiceSessions
                .FirstOrDefaultAsync(css => css.CustomerId == createDto.CustomerId && 
                                          css.ServiceId == createDto.ServiceId && 
                                          css.IsActive);

            CustomerServiceSession? sessionToUse = null;
            bool isNewSessionPackage = false;

            if (activeSession == null)
            {
                // Yeni seans paketi oluştur
                sessionToUse = new CustomerServiceSession
                {
                    CustomerId = createDto.CustomerId,
                    ServiceId = createDto.ServiceId,
                    TotalSessions = service.DefaultSessions,
                    RemainingSessions = service.DefaultSessions,
                    CreatedDate = DateTime.Now,
                    IsActive = true
                };

                _context.CustomerServiceSessions.Add(sessionToUse);
                await _context.SaveChangesAsync();
                isNewSessionPackage = true;
                
                Console.WriteLine($"[LOG] Add: Yeni seans paketi oluşturuldu. CustomerId: {createDto.CustomerId}, ServiceId: {createDto.ServiceId}, TotalSessions: {service.DefaultSessions}");
            }
            else
            {
                // Mevcut aktif seans paketini kullan
                sessionToUse = activeSession;
                Console.WriteLine($"[LOG] Add: Mevcut seans paketi kullanılıyor. CustomerId: {createDto.CustomerId}, ServiceId: {createDto.ServiceId}, RemainingSessions: {activeSession.RemainingSessions}");
            }

            // Randevu oluştur
            var appointment = new Appointment
            {
                CustomerId = createDto.CustomerId,
                ServiceId = createDto.ServiceId,
                AgreedPrice = createDto.AgreedPrice,
                CustomerServiceSessionId = sessionToUse.CustomerServiceSessionId,
                AppointmentDate = createDto.AppointmentDate,
                Status = AppointmentStatus.Scheduled,
                SpecialistId = createDto.SpecialistId
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Ödeme sadece yeni seans paketi oluşturulduğunda ekle
            if (isNewSessionPackage)
            {
                var automaticPayment = new Payment
                {
                    CustomerId = appointment.CustomerId,
                    AppointmentId = appointment.AppointmentId,
                    AmountPaid = appointment.AgreedPrice,
                    PaymentDate = DateTime.Now,
                    PaymentMethod = PaymentMethodType.Cash, // Varsayılan ödeme yöntemi
                    Status = PaymentStatus.Pending,
                    PaymentNotes = $"Yeni seans paketi oluşturuldu - {service.DefaultSessions} seans"
                };

                _context.Payments.Add(automaticPayment);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"[LOG] Add: Yeni seans paketi için ödeme oluşturuldu. Amount: {appointment.AgreedPrice}");
            }
            else
            {
                Console.WriteLine($"[LOG] Add: Mevcut seans paketinden randevu oluşturuldu, ödeme oluşturulmadı.");
            }

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
                CustomerServiceSessionId = sessionToUse.CustomerServiceSessionId,
                TotalSessions = sessionToUse.TotalSessions,
                RemainingSessions = sessionToUse.RemainingSessions,
                UsedSessions = sessionToUse.TotalSessions - sessionToUse.RemainingSessions,
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
            appointment.AppointmentDate = updateDto.AppointmentDate;
            appointment.Status = updateDto.Status;
            appointment.SpecialistId = updateDto.SpecialistId;

            // ÖDEME DURUMU YÖNETİMİ
            var appointmentPayments = await _context.Payments
                .Where(p => p.AppointmentId == id)
                .ToListAsync();

            // Eğer randevu iptal veya gelmedi olursa, bekleyen ödemeleri iptal et
            if (updateDto.Status == AppointmentStatus.Cancelled || updateDto.Status == AppointmentStatus.NoShow)
            {
                foreach (var payment in appointmentPayments.Where(p => p.Status == PaymentStatus.Pending))
                {
                    payment.Status = PaymentStatus.Cancelled;
                    payment.PaymentNotes = $"Randevu {GetAppointmentStatusDisplay(updateDto.Status)} - Otomatik iptal edildi.";
                }
            }
            // Eğer randevu tekrar aktif hale gelirse, iptal edilmiş ödemeleri tekrar bekliyor yap
            else if ((updateDto.Status == AppointmentStatus.Scheduled || updateDto.Status == AppointmentStatus.Confirmed) && 
                     (oldStatus == AppointmentStatus.Cancelled || oldStatus == AppointmentStatus.NoShow))
            {
                foreach (var payment in appointmentPayments.Where(p => p.Status == PaymentStatus.Cancelled))
                {
                    payment.Status = PaymentStatus.Pending;
                    payment.PaymentNotes = $"Randevu {GetAppointmentStatusDisplay(updateDto.Status)} - Otomatik aktif edildi.";
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        // Randevu durumunu güncelle

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatus status)
        {
            var appointment = await _context.Appointments
                .Include(a => a.CustomerServiceSession)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);
            
            if (appointment == null) return NotFound();

            var oldStatus = appointment.Status;
            appointment.Status = status;

            // ÖDEME DURUMU YÖNETİMİ
            var appointmentPayments = await _context.Payments
                .Where(p => p.AppointmentId == id)
                .ToListAsync();

            // Eğer randevu iptal veya gelmedi olursa, bekleyen ödemeleri iptal et
            if (status == AppointmentStatus.Cancelled || status == AppointmentStatus.NoShow)
            {
                foreach (var payment in appointmentPayments.Where(p => p.Status == PaymentStatus.Pending))
                {
                    payment.Status = PaymentStatus.Cancelled;
                    payment.PaymentNotes = $"Randevu {GetAppointmentStatusDisplay(status)} - Otomatik iptal edildi.";
                }

                Console.WriteLine($"[LOG] UpdateStatus: Randevu {id} durumu {GetAppointmentStatusDisplay(oldStatus)} -> {GetAppointmentStatusDisplay(status)} değiştirildi. Bekleyen ödemeler iptal edildi.");
            }
            // Eğer randevu tekrar aktif hale gelirse (Planlandı/Onaylandı), iptal edilmiş ödemeleri tekrar bekliyor yap
            else if ((status == AppointmentStatus.Scheduled || status == AppointmentStatus.Confirmed) && 
                     (oldStatus == AppointmentStatus.Cancelled || oldStatus == AppointmentStatus.NoShow))
            {
                foreach (var payment in appointmentPayments.Where(p => p.Status == PaymentStatus.Cancelled))
                {
                    payment.Status = PaymentStatus.Pending;
                    payment.PaymentNotes = $"Randevu {GetAppointmentStatusDisplay(status)} - Otomatik aktif edildi.";
                }

                Console.WriteLine($"[LOG] UpdateStatus: Randevu {id} durumu {GetAppointmentStatusDisplay(oldStatus)} -> {GetAppointmentStatusDisplay(status)} değiştirildi. İptal edilmiş ödemeler tekrar aktif edildi.");
            }

            // SEANS DURUMU YÖNETİMİ
            if (appointment.CustomerServiceSession != null)
            {
                var session = appointment.CustomerServiceSession;

                // Eğer randevu tamamlandıysa, seans paketinden seans kullan
                if (status == AppointmentStatus.Completed && oldStatus != AppointmentStatus.Completed)
                {
                    if (session.RemainingSessions > 0)
                    {
                        session.RemainingSessions--;
                        
                        // Eğer tüm seanslar bittiyse seans paketini tamamla
                        if (session.RemainingSessions == 0)
                        {
                            session.IsActive = false;
                            session.CompletedDate = DateTime.Now;
                        }

                        Console.WriteLine($"[LOG] UpdateStatus: Randevu {id} tamamlandı. Seans kullanıldı. Kalan seans: {session.RemainingSessions}");
                    }
                }
                // Eğer randevu tamamlandı durumundan başka bir duruma geçerse, seansı geri ver
                else if (oldStatus == AppointmentStatus.Completed && status != AppointmentStatus.Completed)
                {
                    if (session.RemainingSessions < session.TotalSessions)
                    {
                        session.RemainingSessions++;
                        session.IsActive = true;
                        session.CompletedDate = null;

                        Console.WriteLine($"[LOG] UpdateStatus: Randevu {id} tamamlandı durumundan çıkarıldı. Seans geri verildi. Kalan seans: {session.RemainingSessions}");
                    }
                }
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
            var appointment = await _context.Appointments
                .Include(a => a.CustomerServiceSession)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);
            
            if (appointment == null) return NotFound();

            if (appointment.Status == AppointmentStatus.Cancelled)
            {
                return BadRequest("Appointment is already cancelled");
            }

            var oldStatus = appointment.Status;
            appointment.Status = AppointmentStatus.Cancelled;

            //  Bu randevuyla ilgili PENDING payment'ları da CANCELLED yap
            var pendingPayments = await _context.Payments
                .Where(p => p.AppointmentId == id && p.Status == PaymentStatus.Pending)
                .ToListAsync();

            foreach (var payment in pendingPayments)
            {
                payment.Status = PaymentStatus.Cancelled;
                payment.PaymentNotes = "Randevu İptal - Otomatik iptal edildi.";
            }

            Console.WriteLine($"[LOG] Cancel: Randevu {id} iptal edildi. {pendingPayments.Count} ödeme iptal edildi.");

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
            var appointment = await _context.Appointments
                .Include(a => a.CustomerServiceSession)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);
            
            if (appointment == null) return NotFound();

            if (appointment.Status != AppointmentStatus.Confirmed && appointment.Status != AppointmentStatus.Scheduled)
            {
                return BadRequest("Only confirmed or scheduled appointments can be completed");
            }

            var oldStatus = appointment.Status;
            appointment.Status = AppointmentStatus.Completed;

            // Seans paketinden seans kullan
            if (appointment.CustomerServiceSession != null)
            {
                var session = appointment.CustomerServiceSession;
                if (session.RemainingSessions > 0)
                {
                    session.RemainingSessions--;
                    
                    // Eğer tüm seanslar bittiyse seans paketini tamamla
                    if (session.RemainingSessions == 0)
                    {
                        session.IsActive = false;
                        session.CompletedDate = DateTime.Now;
                    }

                    Console.WriteLine($"[LOG] Complete: Randevu {id} tamamlandı. Seans kullanıldı. Kalan seans: {session.RemainingSessions}");
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        // Randevu "gelmedi" olarak işaretle (ödemeleri de güncelle)
        [HttpPut("{id}/noshow")]
        public async Task<IActionResult> MarkNoShow(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.CustomerServiceSession)
                .FirstOrDefaultAsync(a => a.AppointmentId == id);
            
            if (appointment == null) return NotFound();

            if (appointment.Status == AppointmentStatus.NoShow)
            {
                return BadRequest("Appointment is already marked as no-show");
            }

            var oldStatus = appointment.Status;
            appointment.Status = AppointmentStatus.NoShow;

            //  Bu randevuyla ilgili PENDING payment'ları da CANCELLED yap
            var pendingPayments = await _context.Payments
                .Where(p => p.AppointmentId == id && p.Status == PaymentStatus.Pending)
                .ToListAsync();

            foreach (var payment in pendingPayments)
            {
                payment.Status = PaymentStatus.Cancelled;
                payment.PaymentNotes = "Randevu Gelmedi - Otomatik iptal edildi.";
            }

            Console.WriteLine($"[LOG] MarkNoShow: Randevu {id} gelmedi olarak işaretlendi. {pendingPayments.Count} ödeme iptal edildi.");

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Belirli günün randevularını getir (takvim modal için)
        [HttpGet("by-date/{date}")]
        public async Task<IActionResult> GetByDate(DateTime date)
        {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);

            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                    .ThenInclude(s => s.Category)
                .Include(a => a.CustomerServiceSession)
                .Where(a => a.AppointmentDate >= startOfDay && a.AppointmentDate < endOfDay)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            // Kategorilere göre grupla
            var groupedAppointments = appointments
                .GroupBy(a => a.Service.Category?.CategoryName ?? "Diğer")
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(a => new AppointmentResponseDto
                    {
                        AppointmentId = a.AppointmentId,
                        CustomerId = a.CustomerId,
                        CustomerName = a.Customer.FullName,
                        CustomerPhone = a.Customer.PhoneNumber,
                        ServiceId = a.ServiceId,
                        ServiceName = a.Service.ServiceName,
                        CategoryName = a.Service.Category?.CategoryName ?? string.Empty,
                        AgreedPrice = a.AgreedPrice,
                        CustomerServiceSessionId = a.CustomerServiceSessionId,
                        TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                        RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0,
                        UsedSessions = a.CustomerServiceSession != null ? 
                            a.CustomerServiceSession.TotalSessions - a.CustomerServiceSession.RemainingSessions : 0,
                        AppointmentDate = a.AppointmentDate,
                        Status = a.Status,
                        StatusDisplay = GetAppointmentStatusDisplay(a.Status)
                    }).ToList()
                );

            return Ok(groupedAppointments);
        }

        // Müşterinin aktif seanslarını getir
        [HttpGet("customer/{customerId}/active-sessions")]
        public async Task<IActionResult> GetCustomerActiveSessions(int customerId)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!customerExists) return NotFound("Customer not found");

            var activeSessions = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Where(css => css.CustomerId == customerId && css.IsActive && css.RemainingSessions > 0)
                .OrderBy(css => css.CreatedDate)
                .ToListAsync();

            var sessionDtos = activeSessions.Select(s => new AppointmentResponseDto
            {
                CustomerServiceSessionId = s.CustomerServiceSessionId,
                CustomerId = s.CustomerId,
                ServiceId = s.ServiceId,
                ServiceName = s.Service.ServiceName,
                CategoryName = s.Service.Category?.CategoryName ?? string.Empty,
                TotalSessions = s.TotalSessions,
                RemainingSessions = s.RemainingSessions,
                UsedSessions = s.TotalSessions - s.RemainingSessions
            }).ToList();

            return Ok(sessionDtos);
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

        // Rol bazlı filtreleme uygula
        private IQueryable<Appointment> ApplyRoleBasedFilter(IQueryable<Appointment> query)
        {
            var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

            // Admin ve Specialist → Tüm randevuları görebilir
            if (userRoles.Contains("Admin") || userRoles.Contains("Specialist"))
                return query;

            // Staff → Hiçbir randevu göremez (sadece müşteri detayında randevu geçmişi görebilir - frontend'de handle edilecek)
            if (userRoles.Contains("Staff"))
                return query.Where(a => false); // Boş liste

            return query;
        }

        // Kullanıcının randevu ekleme yetkisi var mı ve hangi kategorilere ekleyebilir?
        private async Task<(bool canAdd, List<int> allowedCategoryIds)> GetUserAppointmentPermissions()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

            // Admin → Tüm kategorilere randevu ekleyebilir
            if (userRoles.Contains("Admin"))
            {
                var allCategories = await _context.ServiceCategories.Select(sc => sc.CategoryId).ToListAsync();
                return (true, allCategories);
            }

            // Staff → Randevu ekleyemez
            if (userRoles.Contains("Staff") && !userRoles.Contains("Specialist"))
                return (false, new List<int>());

            // Specialist → Sadece kendi kategorilerinden randevu ekleyebilir
            if (userRoles.Contains("Specialist"))
            {
                var userCategories = await _context.UserServiceCategories
                    .Where(usc => usc.UserId == userId)
                    .Select(usc => usc.ServiceCategoryId)
                    .ToListAsync();

                return (userCategories.Any(), userCategories);
            }

            return (false, new List<int>());
        }
    }
}