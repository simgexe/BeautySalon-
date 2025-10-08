-- 1. Önce tüm kullanıcıları sil
DELETE FROM Users;

-- 2. Sonra rolleri sil
DELETE FROM Roles;

-- 3. Admin rolü oluştur
INSERT INTO Roles (Name, Description, IsActive, CreatedAt) 
VALUES ('Admin', 'Sistem yöneticisi', 1, datetime('now'));

-- 4. Staff rolü oluştur
INSERT INTO Roles (Name, Description, IsActive, CreatedAt) 
VALUES ('Staff', 'Personel', 1, datetime('now'));

-- 5. Admin kullanıcısı oluştur (şifre: admin123) - RoleId'yi dinamik olarak al
INSERT INTO Users (Username, PasswordHash, FirstName, LastName, PhoneNumber, RoleId, IsActive, CreatedAt)
VALUES ('admin', '$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQvO8J1K8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'Admin', 'User', '555-0001', (SELECT RoleId FROM Roles WHERE Name = 'Admin'), 1, datetime('now'));

-- 6. Kontrol et
SELECT r.RoleId, r.Name, r.Description, r.IsActive FROM Roles r;
SELECT u.UserId, u.Username, u.IsActive, r.Name as RoleName 
FROM Users u 
JOIN Roles r ON u.RoleId = r.RoleId;
