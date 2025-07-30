using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.Payment;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        // Tüm ödemeleri getir
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var payments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
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

        // Belirli ödemeyi getir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null) return NotFound();

            var paymentDto = new PaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                CustomerId = payment.CustomerId,
                CustomerName = payment.Customer.FullName,
                AppointmentId = payment.AppointmentId,
                ServiceName = payment.Appointment?.Service?.ServiceName,
                AmountPaid = payment.AmountPaid,
                PaymentDate = payment.PaymentDate,
                PaymentMethod = payment.PaymentMethod,
                PaymentMethodDisplay = GetPaymentMethodDisplay(payment.PaymentMethod),
                Status = payment.Status,
                StatusDisplay = GetPaymentStatusDisplay(payment.Status)
            };

            return Ok(paymentDto);
        }

        // Belirli müşterinin ödemelerini getir
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetCustomerPayments(int customerId)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == customerId);
            if (!customerExists) return NotFound("Customer not found");

            var payments = await _context.Payments
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
                .Where(p => p.CustomerId == customerId)
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

        // Müşterinin borç/alacak durumunu getir
        [HttpGet("customer/{customerId}/balance")]
        public async Task<IActionResult> GetCustomerBalance(int customerId)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null) return NotFound("Customer not found");

            // Müşterinin tüm randevuları ve ödemelerini al
            var appointments = await _context.Appointments
                .Where(a => a.CustomerId == customerId)
                .ToListAsync();

            var payments = await _context.Payments
                .Where(p => p.CustomerId == customerId)
                .ToListAsync();

            // Hesaplamalar
            decimal totalAgreedAmount = appointments.Sum(a => a.AgreedPrice);
            decimal totalPaidAmount = payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => p.AmountPaid);
            decimal pendingAmount = payments.Where(p => p.Status == PaymentStatus.Pending).Sum(p => p.AmountPaid);
            decimal remainingDebt = totalAgreedAmount - totalPaidAmount;
            decimal overPaid = totalPaidAmount > totalAgreedAmount ? totalPaidAmount - totalAgreedAmount : 0;
            var lastPaymentDate = payments.OrderByDescending(p => p.PaymentDate).FirstOrDefault()?.PaymentDate;

            var balanceDto = new CustomerBalanceDto
            {
                CustomerId = customerId,
                CustomerName = customer.FullName,
                TotalAgreedAmount = totalAgreedAmount,
                TotalPaidAmount = totalPaidAmount,
                PendingAmount = pendingAmount,
                RemainingDebt = remainingDebt > 0 ? remainingDebt : 0,
                OverPaid = overPaid,
                TotalPayments = payments.Count,
                LastPaymentDate = lastPaymentDate
            };

            return Ok(balanceDto);
        }

        // Randevunun ödeme durumunu getir
        [HttpGet("appointment/{appointmentId}/status")]
        public async Task<IActionResult> GetAppointmentPaymentStatus(int appointmentId)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Service)
                .Include(a => a.Customer)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);

            if (appointment == null) return NotFound("Appointment not found");

            var payments = await _context.Payments
                .Where(p => p.AppointmentId == appointmentId && p.Status == PaymentStatus.Paid)
                .OrderBy(p => p.PaymentDate)
                .ToListAsync();

            var totalPaid = payments.Sum(p => p.AmountPaid);
            var remainingAmount = appointment.AgreedPrice - totalPaid;

            var paymentHistory = payments.Select(p => new PaymentResponseDto
            {
                PaymentId = p.PaymentId,
                AmountPaid = p.AmountPaid,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                PaymentMethodDisplay = GetPaymentMethodDisplay(p.PaymentMethod),
                Status = p.Status,
                StatusDisplay = GetPaymentStatusDisplay(p.Status)
            }).ToList();

            var paymentStatus = new
            {
                AppointmentId = appointmentId,
                CustomerName = appointment.Customer.FullName,
                ServiceName = appointment.Service.ServiceName,
                AgreedPrice = appointment.AgreedPrice,
                TotalPaid = totalPaid,
                RemainingAmount = remainingAmount > 0 ? remainingAmount : 0,
                IsFullyPaid = remainingAmount <= 0,
                PaymentHistory = paymentHistory
            };

            return Ok(paymentStatus);
        }

        // Bekleyen ödemeleri getir
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPayments()
        {
            var pendingPayments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
                .Where(p => p.Status == PaymentStatus.Pending)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            var paymentDtos = pendingPayments.Select(p => new PaymentResponseDto
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

        // Ödeme yöntemi ve duruma göre filtrele
        [HttpGet("filter")]
        public async Task<IActionResult> GetFilteredPayments([FromQuery] PaymentMethodType? paymentMethod = null, [FromQuery] PaymentStatus? status = null)
        {
            var query = _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
                .AsQueryable();

            if (paymentMethod.HasValue)
                query = query.Where(p => p.PaymentMethod == paymentMethod.Value);

            if (status.HasValue)
                query = query.Where(p => p.Status == status.Value);

            var payments = await query
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

        // Yeni ödeme ekle
        [HttpPost]
        public async Task<IActionResult> Add(CreatePaymentDto createDto)
        {
            // Müşteri var mı kontrol et
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == createDto.CustomerId);
            if (!customerExists)
            {
                return BadRequest("Customer not found");
            }

            // Eğer randevu ID'si varsa, randevunun varlığını kontrol et
            if (createDto.AppointmentId.HasValue)
            {
                var appointmentExists = await _context.Appointments.AnyAsync(a => a.AppointmentId == createDto.AppointmentId.Value);
                if (!appointmentExists)
                {
                    return BadRequest("Appointment not found");
                }
            }

            // Manual mapping: DTO → Entity
            var payment = new Payment
            {
                CustomerId = createDto.CustomerId,
                AppointmentId = createDto.AppointmentId,
                AmountPaid = createDto.AmountPaid,
                PaymentDate = DateTime.Now,
                PaymentMethod = createDto.PaymentMethod,
                Status = PaymentStatus.Paid // Default olarak ödendi
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // İlişkili verileri al response için
            var paymentWithIncludes = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
                .FirstOrDefaultAsync(p => p.PaymentId == payment.PaymentId);

            if (paymentWithIncludes == null)
            {
                return StatusCode(500, "Payment could not be loaded after creation.");
            }

            // Manual mapping: Entity → Response DTO
            var responseDto = new PaymentResponseDto
            {
                PaymentId = paymentWithIncludes.PaymentId,
                CustomerId = paymentWithIncludes.CustomerId,
                CustomerName = paymentWithIncludes.Customer.FullName,
                AppointmentId = paymentWithIncludes.AppointmentId,
                ServiceName = paymentWithIncludes.Appointment?.Service?.ServiceName,
                AmountPaid = paymentWithIncludes.AmountPaid,
                PaymentDate = paymentWithIncludes.PaymentDate,
                PaymentMethod = paymentWithIncludes.PaymentMethod,
                PaymentMethodDisplay = GetPaymentMethodDisplay(paymentWithIncludes.PaymentMethod),
                Status = paymentWithIncludes.Status,
                StatusDisplay = GetPaymentStatusDisplay(paymentWithIncludes.Status)
            };

            return CreatedAtAction(nameof(GetById), new { id = payment.PaymentId }, responseDto);
        }

        // Kısmi ödeme yap (randevu için)
        [HttpPost("partial-payment")]
        public async Task<IActionResult> AddPartialPayment(PartialPaymentDto partialDto)
        {
            var appointment = await _context.Appointments.FindAsync(partialDto.AppointmentId);
            if (appointment == null) return NotFound("Appointment not found");

            // Toplam ödenen miktarı kontrol et
            var existingPayments = await _context.Payments
                .Where(p => p.AppointmentId == partialDto.AppointmentId && p.Status == PaymentStatus.Paid)
                .SumAsync(p => p.AmountPaid);

            if (existingPayments + partialDto.Amount > appointment.AgreedPrice)
            {
                return BadRequest("Payment amount exceeds agreed price");
            }

            var payment = new Payment
            {
                CustomerId = appointment.CustomerId,
                AppointmentId = partialDto.AppointmentId,
                AmountPaid = partialDto.Amount,
                PaymentDate = DateTime.Now,
                PaymentMethod = partialDto.PaymentMethod,
                Status = PaymentStatus.Paid
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Response için ilişkili verileri al
            var paymentWithIncludes = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Service)
                .FirstOrDefaultAsync(p => p.PaymentId == payment.PaymentId);

            if (paymentWithIncludes == null)
            {
                return StatusCode(500, "Payment could not be loaded after creation.");
            }

            var responseDto = new PaymentResponseDto
            {
                PaymentId = paymentWithIncludes.PaymentId,
                CustomerId = paymentWithIncludes.CustomerId,
                CustomerName = paymentWithIncludes.Customer.FullName,
                AppointmentId = paymentWithIncludes.AppointmentId,
                ServiceName = paymentWithIncludes.Appointment?.Service?.ServiceName,
                AmountPaid = paymentWithIncludes.AmountPaid,
                PaymentDate = paymentWithIncludes.PaymentDate,
                PaymentMethod = paymentWithIncludes.PaymentMethod,
                PaymentMethodDisplay = GetPaymentMethodDisplay(paymentWithIncludes.PaymentMethod),
                Status = paymentWithIncludes.Status,
                StatusDisplay = GetPaymentStatusDisplay(paymentWithIncludes.Status)
            };

            return Ok(responseDto);
        }

        // Ödeme güncelle
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdatePaymentDto updateDto)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            // Müşteri var mı kontrol et
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerId == updateDto.CustomerId);
            if (!customerExists)
            {
                return BadRequest("Customer not found");
            }

            // Eğer randevu ID'si varsa, randevunun varlığını kontrol et
            if (updateDto.AppointmentId.HasValue)
            {
                var appointmentExists = await _context.Appointments.AnyAsync(a => a.AppointmentId == updateDto.AppointmentId.Value);
                if (!appointmentExists)
                {
                    return BadRequest("Appointment not found");
                }
            }

            // Manual mapping: DTO → Entity
            payment.CustomerId = updateDto.CustomerId;
            payment.AppointmentId = updateDto.AppointmentId;
            payment.AmountPaid = updateDto.AmountPaid;
            payment.PaymentDate = updateDto.PaymentDate;
            payment.PaymentMethod = updateDto.PaymentMethod;
            payment.Status = updateDto.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Ödeme durumunu güncelle (Pending → Paid)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] PaymentStatus status)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            payment.Status = status;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Ödeme sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Helper metodlar - enum'ları display string'e çevir
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