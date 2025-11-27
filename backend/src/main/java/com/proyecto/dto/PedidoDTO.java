package com.proyecto.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PedidoDTO {
    private String cliente;
    private LocalDateTime fecha;
    private List<ProductoPedidoDTO> productos;

    public PedidoDTO() {
    }

    public String getCliente() {
        return cliente;
    }

    public void setCliente(String cliente) {
        this.cliente = cliente;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public List<ProductoPedidoDTO> getProductos() {
        return productos;
    }

    public void setProductos(List<ProductoPedidoDTO> productos) {
        this.productos = productos;
    }
}
