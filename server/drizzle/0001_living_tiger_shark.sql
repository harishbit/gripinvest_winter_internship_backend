ALTER TABLE `investment_products` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `investments` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());