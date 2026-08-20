-- V1: Initialize complete schema for TaskFlow
-- Creates all tables and indices required for the application

-- usuarios table
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- items_active table (products)
CREATE TABLE items_active (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE,
    barcode VARCHAR(255),
    description VARCHAR(255) NOT NULL,
    price DECIMAL(19,2),
    hidden BOOLEAN,
    searchable BOOLEAN,
    marca VARCHAR(255),
    stock DECIMAL(19,2),
    activo BOOLEAN
);

-- documentos table
CREATE TABLE documentos (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    archivo_original VARCHAR(255),
    fecha TIMESTAMP NOT NULL,
    usuario VARCHAR(255),
    hash VARCHAR(255),
    estado VARCHAR(50) NOT NULL,
    detalles_json TEXT
);

-- pedidos table
CREATE TABLE pedidos (
    id BIGSERIAL PRIMARY KEY,
    cliente VARCHAR(255) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE'
);

-- pedido_items table
CREATE TABLE pedido_items (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT,
    codigo VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- importaciones_csv table
CREATE TABLE importaciones_csv (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    productos_insertados INTEGER NOT NULL,
    productos_actualizados INTEGER NOT NULL,
    errores TEXT,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- otp_2fa table
CREATE TABLE otp_2fa (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- recuperacion_tokens table
CREATE TABLE recuperacion_tokens (
    id UUID PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL,
    expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Performance indices for items_active
CREATE INDEX idx_items_active_code ON items_active(code);
CREATE INDEX idx_items_active_barcode ON items_active(barcode);
CREATE INDEX idx_items_active_activo ON items_active(activo) WHERE activo = true;
