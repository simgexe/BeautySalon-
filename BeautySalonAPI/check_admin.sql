-- Admin kullanıcısını kontrol et
SELECT UserId, Username, PasswordHash, IsActive, RoleId 
FROM "Users" 
WHERE Username = 'admin';

-- Eğer admin yoksa, admin kullanıcısı oluştur
INSERT INTO "Users" (Username, PasswordHash, PhoneNumber, FirstName, LastName, RoleId, IsActive, CreatedAt, UpdatedAt)
SELECT 'admin', '$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQvOQjqKqKqKqKqKqKqKqKqKqKqK', '5555555555', 'Admin', 'User', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE Username = 'admin');

-- Admin kullanıcısının şifresini güncelle (yeni BCrypt hash ile)
UPDATE "Users" 
SET PasswordHash = '$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQvOQjqKqKqKqKqKqKqKqKqKqKqK'
WHERE Username = 'admin';
