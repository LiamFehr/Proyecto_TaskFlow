-- ── V5: Integración Relay ERP ────────────────────────────────────────────────
-- Agrega campos necesarios para la comunicación VPS ↔ ERP de escritorio

-- erp_id: ID del producto en el ERP de escritorio.
-- Se usa para mapear el producto de la VPS al producto local del ERP
-- cuando se reenvía el pedido via WebSocket.
ALTER TABLE items_active
    ADD COLUMN IF NOT EXISTS erp_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_items_active_erp_id ON items_active(erp_id);

-- uuid: identificador único enviado por el ERP para deduplicación de pedidos remotos.
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS uuid VARCHAR(36),
    ADD COLUMN IF NOT EXISTS terminal VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_uuid ON pedidos(uuid) WHERE uuid IS NOT NULL;

-- erp_producto_id en items del pedido: guarda el ID del producto en el ERP
-- para incluirlo en el mensaje WebSocket que recibe el escritorio.
ALTER TABLE pedido_items
    ADD COLUMN IF NOT EXISTS erp_producto_id BIGINT;
