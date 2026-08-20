-- V6: Align VPS products table with Desktop ERP schema
-- Rename items_active to products and add missing fields

-- 1. Rename table if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'items_active') THEN
        ALTER TABLE items_active RENAME TO products;
    END IF;
END $$;

-- 2. Add/Modify columns to match Desktop ERP
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS enterprise_id BIGINT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cost_price DECIMAL(19,2),
    ADD COLUMN IF NOT EXISTS net_price DECIMAL(19,2),
    ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 21.00,
    ADD COLUMN IF NOT EXISTS final_price DECIMAL(19,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS price_source VARCHAR(20) DEFAULT 'FINAL',
    ADD COLUMN IF NOT EXISTS allow_negative_stock BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS stock_alert_threshold DECIMAL(19,2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Data migration: Map old 'description' to 'name' and 'price' to 'final_price'
UPDATE products SET name = description WHERE name IS NULL;
UPDATE products SET final_price = price WHERE final_price = 0 AND price > 0;

-- 4. Clean up old columns if they exist (optional, but cleaner)
-- ALTER TABLE products DROP COLUMN IF EXISTS price; -- Keep it for now to avoid breaking existing queries until code is updated

-- 5. Align PedidoItem for better sync
ALTER TABLE pedido_items
    ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 21.00,
    ADD COLUMN IF NOT EXISTS unit_net_price DECIMAL(19,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_price DECIMAL(19,2) DEFAULT 0;
