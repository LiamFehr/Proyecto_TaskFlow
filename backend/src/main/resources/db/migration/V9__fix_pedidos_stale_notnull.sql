-- V9: Drop NOT NULL on stale columns auto-created by a previous Hibernate ddl-auto=update run.
-- These columns exist because Java field names were changed (camelCase → different name),
-- leaving orphaned NOT NULL columns that are never populated by current Hibernate INSERTs.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pedidos'
          AND column_name = 'fecha_creacion' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE pedidos ALTER COLUMN fecha_creacion DROP NOT NULL;
    END IF;

    -- Also fix vendedor_nombre_old / any other potential stale columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pedidos'
          AND column_name = 'nombre_vendedor' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE pedidos ALTER COLUMN nombre_vendedor DROP NOT NULL;
    END IF;
END $$;
