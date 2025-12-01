-- Optimización de base de datos para búsqueda rápida de productos
-- Ejecutar este script en la base de datos PostgreSQL

-- Crear índice en la columna 'code' para búsquedas O(log n)
CREATE INDEX IF NOT EXISTS idx_items_active_code
    ON items_active(code);

-- Comentario:
-- Con este índice, la búsqueda SELECT * FROM items_active WHERE code = ?
-- será extremadamente rápida incluso con miles de productos.
