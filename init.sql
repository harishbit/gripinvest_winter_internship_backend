-- Initialize the Grip Invest database
-- This file is executed when the MySQL container starts for the first time

USE grip_invest;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    risk_appetite ENUM('low','moderate','high') DEFAULT 'moderate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create investment_products table
CREATE TABLE IF NOT EXISTS investment_products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    investment_type ENUM('bond','fd','mf','etf','other') NOT NULL,
    tenure_months INT NOT NULL,
    annual_yield DECIMAL(5,2) NOT NULL,
    risk_level ENUM('low','moderate','high') NOT NULL,
    min_investment DECIMAL(12,2) DEFAULT 1000.00,
    max_investment DECIMAL(12,2),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    invested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','matured','cancelled') DEFAULT 'active',
    expected_return DECIMAL(12,2),
    maturity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES investment_products(id) ON DELETE CASCADE
);

-- Create transaction_logs table
CREATE TABLE IF NOT EXISTS transaction_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36),
    email VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    http_method ENUM('GET','POST','PUT','DELETE') NOT NULL,
    status_code INT NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample investment products
INSERT INTO investment_products (name, investment_type, tenure_months, annual_yield, risk_level, min_investment, max_investment, description) VALUES
('Government Bond 2024', 'bond', 12, 6.50, 'low', 10000, 1000000, 'Secure government bond with guaranteed returns and low risk profile.'),
('Fixed Deposit Premium', 'fd', 24, 7.25, 'low', 5000, 500000, 'High-yield fixed deposit with flexible tenure options.'),
('Equity Mutual Fund Growth', 'mf', 36, 12.00, 'high', 1000, 1000000, 'Diversified equity fund focusing on growth stocks with high return potential.'),
('Technology ETF', 'etf', 18, 9.75, 'moderate', 2000, 200000, 'Exchange-traded fund tracking technology sector performance.'),
('Corporate Bond Fund', 'bond', 30, 8.50, 'moderate', 15000, 750000, 'Corporate bond fund with moderate risk and steady returns.'),
('Balanced Mutual Fund', 'mf', 24, 10.25, 'moderate', 2000, 500000, 'Balanced fund with mix of equity and debt for stable growth.'),
('Gold ETF', 'etf', 12, 5.50, 'low', 1000, 100000, 'Gold exchange-traded fund for portfolio diversification.'),
('High Yield Bond', 'bond', 18, 11.00, 'high', 25000, 1000000, 'High-yield corporate bonds with higher risk and return potential.');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_product_id ON investments(product_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX idx_transaction_logs_created_at ON transaction_logs(created_at);
CREATE INDEX idx_investment_products_type ON investment_products(investment_type);
CREATE INDEX idx_investment_products_risk_level ON investment_products(risk_level);
