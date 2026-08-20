-- V7: Fix NULLs that prevent Hibernate from starting
UPDATE products SET version = 0 WHERE version IS NULL;
UPDATE products SET enterprise_id = 1 WHERE enterprise_id IS NULL;
UPDATE products SET name = description WHERE name IS NULL;
UPDATE products SET final_price = 0 WHERE final_price IS NULL;
UPDATE products SET vat_rate = 21.00 WHERE vat_rate IS NULL;
UPDATE products SET price_source = 'FINAL' WHERE price_source IS NULL;
UPDATE products SET allow_negative_stock = true WHERE allow_negative_stock IS NULL;
UPDATE products SET stock = 0 WHERE stock IS NULL;
UPDATE products SET hidden = false WHERE hidden IS NULL;
UPDATE products SET searchable = true WHERE searchable IS NULL;
