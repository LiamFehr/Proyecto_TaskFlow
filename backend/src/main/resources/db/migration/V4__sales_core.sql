-- ============================================
-- V4: SALES CORE
-- TaskFlow 2.0 - Sprint 1
-- SIN payments, SIN audit_log global
-- ============================================

-- Sales
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    terminal_id BIGINT NOT NULL REFERENCES terminals(id),
    sale_number VARCHAR(3) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    
    state VARCHAR(20) NOT NULL CHECK (state IN ('DRAFT', 'OPEN', 'IN_QUEUE', 'IN_PROGRESS', 'CLOSED', 'CANCELLED')),
    documentation_mode VARCHAR(30) CHECK (documentation_mode IN ('NONE', 'BUDGET', 'INTERNAL', 'DELIVERY_NOTE', 'FISCAL_INVOICE')),
    
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    
    total_amount NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Sale Items (con snapshot completo)
CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES items_active(id),
    
    product_code VARCHAR(50),
    product_description VARCHAR(500) NOT NULL,
    
    quantity NUMERIC(19, 3) NOT NULL,
    
    -- SNAPSHOT INMUTABLE DE PRECIOS
    unit_net_price NUMERIC(19, 2) NOT NULL,
    vat_rate_snapshot NUMERIC(5, 2) NOT NULL,
    vat_amount NUMERIC(19, 2) NOT NULL,
    unit_final_price NUMERIC(19, 2) NOT NULL,
    total_price NUMERIC(19, 2) NOT NULL,
    
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(19, 2) DEFAULT 0.00,
    
    line_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sale Status History (auditoría de cambios de estado)
CREATE TABLE sale_status_history (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    old_state VARCHAR(20),
    new_state VARCHAR(20) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Sale Locks (locks explícitos para atención en caja)
CREATE TABLE sale_locks (
    sale_id BIGINT PRIMARY KEY REFERENCES sales(id) ON DELETE CASCADE,
    locked_by VARCHAR(255) NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    terminal_id BIGINT REFERENCES terminals(id),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Índices
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_sales_terminal ON sales(terminal_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_state ON sales(state);
CREATE INDEX idx_sales_opened_at ON sales(opened_at DESC);
CREATE INDEX idx_sales_sale_number ON sales(sale_number);
CREATE INDEX idx_sales_state_opened ON sales(state, opened_at DESC);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE INDEX idx_sale_status_history_sale ON sale_status_history(sale_id, changed_at DESC);

CREATE INDEX idx_sale_locks_locked_by ON sale_locks(locked_by);
CREATE INDEX idx_sale_locks_expires_at ON sale_locks(expires_at);

-- Trigger para updated_at
CREATE TRIGGER update_sales_updated_at 
BEFORE UPDATE ON sales 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar cambios de estado
CREATE OR REPLACE FUNCTION log_sale_state_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.state IS DISTINCT FROM NEW.state THEN
        INSERT INTO sale_status_history (sale_id, old_state, new_state, changed_by, changed_at)
        VALUES (NEW.id, OLD.state, NEW.state, NEW.updated_by, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_sale_state_change
AFTER UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION log_sale_state_change();

-- Comentarios
COMMENT ON TABLE sales IS 'Ventas con 6 estados + optimistic locking';
COMMENT ON COLUMN sales.sale_number IS 'Turno alfanumérico VARCHAR(3): A01-Z99';
COMMENT ON COLUMN sales.version IS 'Optimistic locking';
COMMENT ON TABLE sale_items IS 'Items con snapshot inmutable de precios';
COMMENT ON TABLE sale_status_history IS 'Auditoría de cambios de estado de ventas';
COMMENT ON TABLE sale_locks IS 'Locks explícitos para atención en caja (TTL)';
