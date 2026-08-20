-- ============================================
-- V1: SYSTEM INITIALIZATION
-- TaskFlow 2.0 - Sprint 1
-- ============================================

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- External services status
CREATE TABLE external_service_status (
    service_name VARCHAR(50) PRIMARY KEY,
    health VARCHAR(20) NOT NULL CHECK (health IN ('HEALTHY', 'DEGRADED', 'DOWN')),
    last_check TIMESTAMPTZ,
    last_error TEXT,
    metadata JSONB
);

-- Branches
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Terminals
CREATE TABLE terminals (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    name VARCHAR(100) NOT NULL,
    identifier VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('POS', 'BACKOFFICE', 'MOBILE')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Turn Sequences (por sucursal)
CREATE TABLE turn_sequences (
    branch_id BIGINT PRIMARY KEY REFERENCES branches(id),
    current_prefix CHAR(1) NOT NULL DEFAULT 'A',
    current_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Función para generar turnos (atómica)
CREATE OR REPLACE FUNCTION generate_next_turn(p_branch_id BIGINT)
RETURNS VARCHAR(3) AS $$
DECLARE
    v_prefix CHAR(1);
    v_number INTEGER;
    next_turn VARCHAR(3);
BEGIN
    -- Lock row para concurrencia
    SELECT current_prefix, current_number INTO v_prefix, v_number
    FROM turn_sequences
    WHERE branch_id = p_branch_id
    FOR UPDATE;
    
    -- Incrementar número
    v_number := v_number + 1;
    
    -- Si supera 99, ir a siguiente letra
    IF v_number > 99 THEN
        v_number := 1;
        v_prefix := CHR(ASCII(v_prefix) + 1);
        
        -- Si supera Z, volver a A
        IF v_prefix > 'Z' THEN
            v_prefix := 'A';
        END IF;
    END IF;
    
    -- Actualizar secuencia
    UPDATE turn_sequences
    SET current_prefix = v_prefix,
        current_number = v_number,
        updated_at = NOW(),
        version = version + 1
    WHERE branch_id = p_branch_id;
    
    -- Retornar turno formateado (ej: "A01")
    next_turn := v_prefix || LPAD(v_number::TEXT, 2, '0');
    RETURN next_turn;
END;
$$ LANGUAGE plpgsql;

-- Seeds
INSERT INTO branches (id, name, active) VALUES (1, 'Sucursal Principal', true);
INSERT INTO terminals (id, branch_id, name, identifier, type) 
VALUES (1, 1, 'Terminal 1', 'TERM-001', 'POS');
INSERT INTO turn_sequences (branch_id, current_prefix, current_number)
VALUES (1, 'A', 0);

-- Settings defaults
INSERT INTO system_settings (key, value, description) VALUES
('app_version', '2.0.0', 'Versión de la aplicación'),
('timezone', 'America/Argentina/Buenos_Aires', 'Zona horaria'),
('currency', 'ARS', 'Moneda por defecto'),
('vat_default_rate', '21.00', 'Alícuota IVA por defecto');

-- Ajustar secuencias después de seeds
SELECT setval('branches_id_seq', (SELECT MAX(id) FROM branches));
SELECT setval('terminals_id_seq', (SELECT MAX(id) FROM terminals));

-- Comentarios
COMMENT ON TABLE turn_sequences IS 'Secuencia de turnos por sucursal (A01-Z99 cíclico)';
COMMENT ON FUNCTION generate_next_turn IS 'Genera próximo turno atómicamente con lock';
