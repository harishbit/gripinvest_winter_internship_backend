CREATE TABLE `password_reset_tokens` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`email` varchar(255) NOT NULL,
	`token` varchar(6) NOT NULL,
	`expires_at` datetime NOT NULL,
	`is_used` enum('0','1') DEFAULT '0',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`)
);
