-- Performance optimization indexes for BOL and Transaction tables
-- Run this SQL to improve query performance

-- Indexes for BillOfLading table
CREATE INDEX IF NOT EXISTS idx_bill_of_lading_date ON bill_of_lading(date);
CREATE INDEX IF NOT EXISTS idx_bill_of_lading_work_order_no ON bill_of_lading(work_order_no);
CREATE INDEX IF NOT EXISTS idx_bill_of_lading_driver_name ON bill_of_lading(driver_name);

-- Indexes for Transaction table
CREATE INDEX IF NOT EXISTS idx_transaction_work_order_no ON transactions(work_order_no);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_bol_id ON transactions(bol_id);
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON transactions(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transaction_work_order_collected ON transactions(work_order_no, collected_amount);
CREATE INDEX IF NOT EXISTS idx_bill_of_lading_date_work_order ON bill_of_lading(date, work_order_no);

-- Analyze tables to update statistics
ANALYZE bill_of_lading;
ANALYZE transaction;
