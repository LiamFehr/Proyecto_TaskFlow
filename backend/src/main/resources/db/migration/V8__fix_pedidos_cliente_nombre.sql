-- V8: Remove stale cliente_nombre NOT NULL constraint left by a previous Hibernate ddl-auto=update run.
-- The entity field is mapped to column "cliente" (NOT NULL). The column "cliente_nombre" is
-- redundant; make it nullable so existing INSERTs don't fail.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'pedidos'
          AND column_name  = 'cliente_nombre'
          AND is_nullable  = 'NO'
    ) THEN
        ALTER TABLE pedidos ALTER COLUMN cliente_nombre DROP NOT NULL;
    END IF;
END $$;
