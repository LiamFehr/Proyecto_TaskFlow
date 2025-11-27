package com.proyecto.dto;

public class ProductoPedidoDTO {
    private String codigo;
    private String descripcion;
    private Integer cantidad;

    public ProductoPedidoDTO() {
    }

    public ProductoPedidoDTO(String codigo, String descripcion, Integer cantidad) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
