using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.Customer;
using BeautySalonAPI.DTOs.Appointment;
using BeautySalonAPI.DTOs.Payment;
using BeautySalonAPI.DTOs.Service;
using BeautySalonAPI.DTOs.CustomerServiceSession;


using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomersController(AppDbContext context)
        {
            _context = context;
        }

        // Tüm müşterileri getir (özet liste için)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _context.Customers.ToListAsync();

            var customerDtos = customers.Select(c => new CustomerSummaryDto
            {
                CustomerId = c.CustomerId,
                FullName = c.FullName,
                PhoneNumber = c.PhoneNumber,
                Notes = c.Notes
            }).ToList();

            return Ok(customerDtos);
        }

        // Belirli müşteriyi getir (detay için)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.Appointments)
                    .ThenInclude(a => a.Service)
                        .ThenInclude(s => s.Category)
                .Include(c => c.Appointments)
                    .ThenInclude(a => a.Specialist)
                .Include(c => c.Payments)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (customer == null) return NotFound();

            // Tüm seans paketlerini al (aktif + tamamlanmış)
            var allSessions = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Where(css => css.CustomerId == id)
                .ToListAsync();

            // Aktif seans paketlerini al (finansal hesaplamalar için)
            var activeSessions = allSessions.Where(s => s.IsActive).ToList();

            // Finansal hesaplamalar - Sadece yeni seans paketi oluşturan randevuları dahil et
            var totalDebt = customer.Appointments
                .Where(a => a.Status == AppointmentStatus.Scheduled || 
                           a.Status == AppointmentStatus.Confirmed || 
                           a.Status == AppointmentStatus.Completed)
                .Where(a => a.CustomerServiceSessionId.HasValue)
                .GroupBy(a => a.CustomerServiceSessionId)
                .Select(g => g.OrderBy(a => a.AppointmentDate).First()) // Her seans paketinin sadece ilk randevusunu al
                .Sum(a => a.AgreedPrice);
            
            var totalPaid = customer.Payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .Sum(p => p.AmountPaid);
            
            var netDebt = totalDebt - totalPaid;

            // Seans hesaplamaları (aktif seans paketlerinden)
            var totalSessions = activeSessions.Sum(s => s.TotalSessions);
            var remainingSessions = activeSessions.Sum(s => s.RemainingSessions);
            var usedSessions = totalSessions - remainingSessions;

            // İstatistikler
            var totalAppointments = customer.Appointments.Count;
            var completedAppointments = customer.Appointments.Count(a => a.Status == AppointmentStatus.Completed);
            var lastVisit = customer.Appointments
                .Where(a => a.Status == AppointmentStatus.Completed)
                .OrderByDescending(a => a.AppointmentDate)
                .FirstOrDefault()?.AppointmentDate;

            // Detay listeleri - tüm seans paketleri (aktif + tamamlanmış)
            var sessions = allSessions.Select(s => new CustomerServiceSessionDto
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

            var appointmentHistory = customer.Appointments
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new AppointmentHistoryDto
                {
                    AppointmentId = a.AppointmentId,
                    AppointmentDate = a.AppointmentDate,
                    ServiceName = a.Service.ServiceName,
                ServiceCategory = a.Service.Category?.CategoryName ?? string.Empty,
                    AgreedPrice = a.AgreedPrice,
                    Status = GetAppointmentStatusDisplay(a.Status),
                    CustomerServiceSessionId = a.CustomerServiceSessionId,
                    TotalSessions = a.CustomerServiceSession?.TotalSessions ?? 0,
                    RemainingSessions = a.CustomerServiceSession?.RemainingSessions ?? 0
                }).ToList();

            var paymentHistory = customer.Payments
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new PaymentHistoryDto
                {
                    PaymentId = p.PaymentId,
                    PaymentDate = p.PaymentDate,
                    AmountPaid = p.AmountPaid,
                    PaymentMethod = GetPaymentMethodDisplay(p.PaymentMethod),
                    Status = GetPaymentStatusDisplay(p.Status),
                    PaymentNotes = p.PaymentNotes,
                    AppointmentInfo = p.Appointment != null ? 
                        $"{p.Appointment.Service.ServiceName} - {p.Appointment.AppointmentDate:dd.MM.yyyy}" : 
                        "Genel Ödeme"
                }).ToList();

            var customerDetailDto = new CustomerDetailDto
            {
                CustomerId = customer.CustomerId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                Notes = customer.Notes,
                TotalDebt = totalDebt,
                TotalPaid = totalPaid,
                NetDebt = netDebt,
                TotalSessions = totalSessions,
                RemainingSessions = remainingSessions,
                UsedSessions = usedSessions,
                TotalAppointments = totalAppointments,
                CompletedAppointments = completedAppointments,
                LastVisit = lastVisit,
                FirstAppointmentDate = customer.Appointments.OrderBy(a => a.AppointmentDate).FirstOrDefault()?.AppointmentDate,
                SpecialistName = customer.Appointments
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => a.Specialist != null ? ($"{a.Specialist.FirstName} {a.Specialist.LastName}").Trim() : null)
                    .FirstOrDefault(),
                Sessions = sessions,
                AppointmentHistory = appointmentHistory,
                PaymentHistory = paymentHistory
            };

            return Ok(customerDetailDto);
        }

        // Müşteri arama (telefon veya isim ile)
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Search query cannot be empty");

            var customers = await _context.Customers
                .Where(c => c.FullName.Contains(query) || c.PhoneNumber.Contains(query))
                .ToListAsync();

            var customerDtos = customers.Select(c => new CustomerSummaryDto
            {
                CustomerId = c.CustomerId,
                FullName = c.FullName,
                PhoneNumber = c.PhoneNumber
            }).ToList();

            return Ok(customerDtos);
        }

        // Yeni müşteri ekle
        [HttpPost]
        public async Task<IActionResult> Add(CreateCustomerDto createDto)
        {
            // Manual mapping: DTO → Entity
            var customer = new Customer
            {
                FullName = createDto.FullName,
                PhoneNumber = createDto.PhoneNumber,
                Notes = createDto.Notes ?? string.Empty
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Manual mapping: Entity → Response DTO
            var responseDto = new CustomerResponseDto
            {
                CustomerId = customer.CustomerId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                Notes = customer.Notes
            };

            return CreatedAtAction(nameof(GetById), new { id = customer.CustomerId }, responseDto);
        }

        // Müşteri güncelle
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateCustomerDto updateDto)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            // Manual mapping: DTO → Entity
            customer.FullName = updateDto.FullName ?? string.Empty;
            customer.PhoneNumber = updateDto.PhoneNumber ?? string.Empty;
            customer.Notes = updateDto.Notes ?? string.Empty;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Müşteri sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            // İlişkili kayıtları kontrol et
            var hasAppointments = await _context.Appointments.AnyAsync(a => a.CustomerId == id);
            var hasPayments = await _context.Payments.AnyAsync(p => p.CustomerId == id);

            if (hasAppointments || hasPayments)
            {
                return BadRequest("Cannot delete customer with existing appointments or payments");
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Müşterinin randevularını getir
        [HttpGet("{id}/appointments")]
        public async Task<IActionResult> GetCustomerAppointments(int id)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == id);
            if (!customerExists) return NotFound("Customer not found");

            var appointments = await _context.Appointments
                .Include(a => a.Service)
                .ThenInclude(s => s.Category)
                .Include(a => a.CustomerServiceSession)
                .Where(a => a.CustomerId == id)
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

        // Müşterinin ödemelerini getir
        [HttpGet("{id}/payments")]
        public async Task<IActionResult> GetCustomerPayments(int id)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == id);
            if (!customerExists) return NotFound("Customer not found");

            var payments = await _context.Payments
                .Include(p => p.Appointment)
                .ThenInclude(a => a!.Service)
                .Where(p => p.CustomerId == id)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            var paymentDtos = payments.Select(p => new PaymentResponseDto
            {
                PaymentId = p.PaymentId,
                CustomerId = p.CustomerId,
                CustomerName = p.Customer.FullName,
                AppointmentId = p.AppointmentId,
                ServiceName = p.Appointment?.Service?.ServiceName,
                AmountPaid = p.AmountPaid,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                PaymentMethodDisplay = GetPaymentMethodDisplay(p.PaymentMethod),
                Status = p.Status,
                StatusDisplay = GetPaymentStatusDisplay(p.Status)
            }).ToList();

            return Ok(paymentDtos);
        }

        // Müşterinin aktif seanslarını getir
        [HttpGet("{id}/sessions")]
        public async Task<IActionResult> GetCustomerSessions(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            var activeSessions = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Where(css => css.CustomerId == id && css.IsActive)
                .OrderBy(css => css.CreatedDate)
                .ToListAsync();

            var sessionDtos = activeSessions.Select(s => new CustomerServiceSessionDto
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

        // Müşterinin tüm seans geçmişini getir
        [HttpGet("{id}/session-history")]
        public async Task<IActionResult> GetCustomerSessionHistory(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            var sessions = await _context.CustomerServiceSessions
                .Include(css => css.Service)
                    .ThenInclude(s => s.Category)
                .Where(css => css.CustomerId == id)
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

        private string GetPaymentMethodDisplay(PaymentMethodType method)
        {
            return method switch
            {
                PaymentMethodType.Cash => "Nakit",
                PaymentMethodType.CreditCard => "Kredi Kartı",
                PaymentMethodType.DebitCard => "Banka Kartı",
                PaymentMethodType.BankTransfer => "Havale",
                _ => method.ToString()
            };
        }

        private string GetPaymentStatusDisplay(PaymentStatus status)
        {
            return status switch
            {
                PaymentStatus.Pending => "Bekliyor",
                PaymentStatus.Paid => "Ödendi",
                PaymentStatus.Cancelled => "İptal",
                PaymentStatus.Refunded => "İade",
                _ => status.ToString()
            };
        }
    }
}