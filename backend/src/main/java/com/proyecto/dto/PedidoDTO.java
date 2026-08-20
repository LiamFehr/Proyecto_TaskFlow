package com.proyecto.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PedidoDTO {
    private Long id;
    private String numeroOrden;
    private String vendedorNombre;
    private String clienteNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaCierre;
    private String estado; // String para facilitar al frontend
    private Boolean enCaja;
    private String cajeroAtendiendo;
    private BigDecimal total;
    private String metodoPago;
    private BigDecimal montoEntregado;
    private List<ProductoPedidoDTO> items;
}
