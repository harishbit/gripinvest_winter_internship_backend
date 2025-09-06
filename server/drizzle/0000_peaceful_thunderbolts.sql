CREATE TABLE `investment_products` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`name` varchar(255) NOT NULL,
	`investment_type` enum('bond','fd','mf','etf','other') NOT NULL,
	`tenure_months` int NOT NULL,
	`annual_yield` decimal(5,2) NOT NULL,
	`risk_level` enum('low','moderate','high') NOT NULL,
	`min_investment` decimal(12,2) DEFAULT '1000',
	`max_investment` decimal(12,2),
	`description` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`user_id` char(36) NOT NULL,
	`product_id` char(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`invested_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`status` enum('active','matured','cancelled') DEFAULT 'active',
	`expected_return` decimal(12,2),
	`maturity_date` datetime,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` char(36),
	`email` varchar(255),
	`endpoint` varchar(255) NOT NULL,
	`http_method` enum('GET','POST','PUT','DELETE') NOT NULL,
	`status_code` int NOT NULL,
	`error_message` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100),
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`risk_appetite` enum('low','moderate','high') DEFAULT 'moderate',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
