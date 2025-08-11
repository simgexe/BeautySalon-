using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.Customer;
using BeautySalonAPI.DTOs.Appointment;
using BeautySalonAPI.DTOs.Payment;
using BeautySalonAPI.DTOs.Service;


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
                .Include(c => c.Payments)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (customer == null) return NotFound();

            // İstatistikleri hesapla
            var totalAppointments = customer.Appointments.Count;
            var completedAppointments = customer.Appointments.Count(a => a.Status == AppointmentStatus.Completed);
            var totalSpent = customer.Payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => p.AmountPaid);
            var totalAgreed = customer.Appointments.Sum(a => a.AgreedPrice);
            var remainingDebt = totalAgreed - totalSpent;
            var lastVisit = customer.Appointments
                .Where(a => a.Status == AppointmentStatus.Completed)
                .OrderByDescending(a => a.AppointmentDate)
                .FirstOrDefault()?.AppointmentDate;

            var customerDetailDto = new CustomerDetailDto
            {
                CustomerId = customer.CustomerId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                Notes = customer.Notes,
                TotalAppointments = totalAppointments,
                CompletedAppointments = completedAppointments,
                TotalSpent = totalSpent,
                RemainingDebt = remainingDebt,
                LastVisit = lastVisit
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
                Notes = createDto.Notes
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
            customer.FullName = updateDto.FullName;
            customer.PhoneNumber = updateDto.PhoneNumber;
            customer.Notes = updateDto.Notes;

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
                .Where(a => a.CustomerId == id)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CustomerId = a.CustomerId,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.ServiceName,
                CategoryName = a.Service.Category.CategoryName,
                AgreedPrice = a.AgreedPrice,
                TotalSessions = a.TotalSessions,
                RemainingSessions = a.RemainingSessions,
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
                .ThenInclude(a => a.Service)
                .Where(p => p.CustomerId == id)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            var paymentDtos = payments.Select(p => new PaymentResponseDto
            {
                PaymentId = p.PaymentId,
                CustomerId = p.CustomerId,
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