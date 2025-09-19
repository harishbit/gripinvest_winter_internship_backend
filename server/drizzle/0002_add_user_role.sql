-- Add role column to users table
ALTER TABLE `users` ADD COLUMN `role` ENUM('user', 'admin') DEFAULT 'user';

-- Update existing users to have 'user' role by default
UPDATE `users` SET `role` = 'user' WHERE `role` IS NULL;
