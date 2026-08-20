-- ============================================
-- V3: PRODUCTS - MODELO DE PRECIOS FLEXIBLE
-- TaskFlow 2.0 - Sprint 1
-- SIN TRIGGERS - Lógica en ProductPricingService
-- ============================================

-- Agregar columnas de precios
ALTER TABLE items_active 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(19, 2),
ADD COLUMN IF NOT EXISTS net_price NUMERIC(19, 2),
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
ADD COLUMN IF NOT EXISTS final_price NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS price_source VARCHAR(20) NOT NULL DEFAULT 'FINAL';

-- Constraints
ALTER TABLE items_active 
ADD CONSTRAINT chk_vat_rate CHECK (vat_rate >= 0 AND vat_rate <= 100),
ADD CONSTRAINT chk_final_price CHECK (final_price >= 0),
ADD CONSTRAINT chk_price_source CHECK (price_source IN ('FINAL', 'NET', 'MIXED'));

-- Stock control
ALTER TABLE items_active 
ADD COLUMN IF NOT EXISTS allow_negative_stock BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS stock_alert_threshold NUMERIC(19, 2) DEFAULT 10.00;

-- Optimistic locking
ALTER TABLE items_active 
ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- Migrar datos existentes (si había campo 'price')
UPDATE items_active 
SET 
    final_price = COALESCE(price, 0.00),
    net_price = ROUND(COALESCE(price, 0.00) / 1.21, 2),
    price_source = 'FINAL',
    vat_rate = 21.00
WHERE final_price = 0.00;

-- Índices
CREATE INDEX idx_items_active_price_source ON items_active(price_source);
CREATE INDEX idx_items_active_low_stock ON items_active(stock) 
WHERE stock IS NOT NULL AND stock <= stock_alert_threshold;

-- Comentarios
COMMENT ON TABLE items_active IS 'Productos con modelo de precios flexible (lógica en código)';
COMMENT ON COLUMN items_active.cost_price IS 'Costo real (opcional)';
COMMENT ON COLUMN items_active.net_price IS 'Precio sin IVA';
COMMENT ON COLUMN items_active.vat_rate IS 'Alícuota IVA editable (0-100)';
COMMENT ON COLUMN items_active.final_price IS 'Precio de lista con IVA (PRINCIPAL)';
COMMENT ON COLUMN items_active.price_source IS 'FINAL (calcular net en código), NET (calcular final en código), MIXED (respetar ambos)';
COMMENT ON COLUMN items_active.allow_negative_stock IS 'Permite stock negativo';
COMMENT ON COLUMN items_active.stock_alert_threshold IS 'Umbral alerta stock bajo';
COMMENT ON COLUMN items_active.version IS 'Optimistic locking';
