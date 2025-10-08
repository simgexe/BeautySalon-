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
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<UserServiceCategory> UserServiceCategories { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<LaserSession> LaserSessions { get; set; }
        public DbSet<RegionalThinningSession> RegionalThinningSessions { get; set; }
        
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

            modelBuilder.Entity<Expense>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<LaserSession>()
                .Property(ls => ls.EnergyJPerCm2)
                .HasPrecision(10, 2);

            modelBuilder.Entity<LaserSession>()
                .Property(ls => ls.Speed)
                .HasPrecision(10, 2);

            // RegionalThinningSession decimal precision'ları
            modelBuilder.Entity<RegionalThinningSession>()
                .Property(rts => rts.Belly)
                .HasPrecision(10, 2);

            modelBuilder.Entity<RegionalThinningSession>()
                .Property(rts => rts.RightArm)
                .HasPrecision(10, 2);

            modelBuilder.Entity<RegionalThinningSession>()
                .Property(rts => rts.LeftArm)
                .HasPrecision(10, 2);

            modelBuilder.Entity<RegionalThinningSession>()
                .Property(rts => rts.RightLeg)
                .HasPrecision(10, 2);

            modelBuilder.Entity<RegionalThinningSession>()
                .Property(rts => rts.LeftLeg)
                .HasPrecision(10, 2);

            modelBuilder.Entity<LaserSession>()
                .HasOne(ls => ls.Customer)
                .WithMany(c => c.LaserSessions)
                .HasForeignKey(ls => ls.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LaserSession>()
                .HasOne(ls => ls.Specialist)
                .WithMany()
                .HasForeignKey(ls => ls.SpecialistId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            // RegionalThinningSession konfigürasyonları
            modelBuilder.Entity<RegionalThinningSession>()
                .HasOne(rts => rts.Customer)
                .WithMany(c => c.RegionalThinningSessions)
                .HasForeignKey(rts => rts.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RegionalThinningSession>()
                .HasOne(rts => rts.Specialist)
                .WithMany()
                .HasForeignKey(rts => rts.SpecialistId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            // Appointment-Specialist ilişkisi
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Specialist)
                .WithMany()
                .HasForeignKey(a => a.SpecialistId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

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
                .HasIndex(u => u.PhoneNumber)
                .IsUnique();

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();

            // User-Role ilişkisi (eski - geriye uyumluluk için)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            // UserRole many-to-many ilişkisi
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserServiceCategory many-to-many ilişkisi
            modelBuilder.Entity<UserServiceCategory>()
                .HasKey(usc => new { usc.UserId, usc.ServiceCategoryId });

            modelBuilder.Entity<UserServiceCategory>()
                .HasOne(usc => usc.User)
                .WithMany(u => u.UserServiceCategories)
                .HasForeignKey(usc => usc.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserServiceCategory>()
                .HasOne(usc => usc.ServiceCategory)
                .WithMany(sc => sc.UserServiceCategories)
                .HasForeignKey(usc => usc.ServiceCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, Name = "Admin", Description = "Sistem yöneticisi", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Role { RoleId = 2, Name = "Staff", Description = "Personel - Sadece randevu geçmişi ve seans paketleri görebilir", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Role { RoleId = 3, Name = "Customer", Description = "Müşteri", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Role { RoleId = 4, Name = "Specialist", Description = "Uzmanlık alanına göre randevu ve ödeme yönetimi", IsActive = true, CreatedAt = DateTime.UtcNow }
            );

            // Default Admin User - GEÇİCİ: Düz metin şifre (üretimde hash'e geri dön!)
            modelBuilder.Entity<User>().HasData(
                new User 
                { 
                    UserId = 1, 
                    Username = "admin", 
                    PhoneNumber = "0555 123 45 67", 
                    PasswordHash = "admin123", // GEÇİCİ: Düz metin
                    FirstName = "Admin",
                    LastName = "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    RoleId = 1 // Geriye uyumluluk için
                }
            );

            // NOT: UserRoles seed data manuel olarak eklenecek (migration sonrası)
            // Migration sırasında foreign key hatası vermemesi için burada eklenmedi
        }
    }
}
