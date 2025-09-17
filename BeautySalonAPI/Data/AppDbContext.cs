using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Entities;

namespace BeautySalonAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<ServiceCategory> ServiceCategories { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<CustomerServiceSession> CustomerServiceSessions { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Decimal precision'ları belirle
            modelBuilder.Entity<Payment>()
                .Property(p => p.AmountPaid)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Appointment>()
                .Property(a => a.AgreedPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Service>()
                .Property(s => s.Price)
                .HasPrecision(18, 2);

            // CustomerServiceSession için unique constraint
            modelBuilder.Entity<CustomerServiceSession>()
                .HasIndex(css => new { css.CustomerId, css.ServiceId, css.IsActive })
                .HasFilter("IsActive = 1")
                .IsUnique();

            // User ve Role konfigürasyonları
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();

            // User-Role ilişkisi
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);


            // Seed Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, Name = "Admin", Description = "Sistem yöneticisi", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Role { RoleId = 2, Name = "Staff", Description = "Personel", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Role { RoleId = 3, Name = "Customer", Description = "Müşteri", IsActive = true, CreatedAt = DateTime.UtcNow }
            );

            // Default Admin User (şimdilik basit - ileride JWT eklenince güncellenecek)
            modelBuilder.Entity<User>().HasData(
                new User 
                { 
                    UserId = 1, 
                    Username = "admin", 
                    Email = "admin@beautysalon.com", 
                    PasswordHash = "admin123", // Şimdilik düz metin - ileride hash'lenecek
                    FirstName = "Admin",
                    LastName = "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    RoleId = 1
                }
            );
        }
    }
}
