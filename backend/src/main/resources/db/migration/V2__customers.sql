-- ============================================
-- V2: CUSTOMERS
-- TaskFlow 2.0 - Sprint 1
-- ============================================

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CONSUMER_FINAL', 'REGISTERED')),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_tax_id ON customers(tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_customers_active ON customers(active);
CREATE INDEX idx_customers_name ON customers(name);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at 
BEFORE UPDATE ON customers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: Consumidor Final (OBLIGATORIO id=1)
INSERT INTO customers (id, type, name, active, created_at) 
VALUES (1, 'CONSUMER_FINAL', 'Consumidor Final', true, NOW());

-- CRÍTICO: Ajustar secuencia para evitar colisión
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- Comentarios
COMMENT ON TABLE customers IS 'Clientes: CONSUMER_FINAL (id=1 fijo) + REGISTERED';
COMMENT ON COLUMN customers.version IS 'Optimistic locking';
