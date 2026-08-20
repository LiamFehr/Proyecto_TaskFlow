package com.proyecto.repository;

import com.proyecto.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByEstadoOrderByFechaDesc(Pedido.EstadoPedido estado);

    List<Pedido> findByEstadoInOrderByFechaAsc(List<Pedido.EstadoPedido> estados);

    // Para obtener el último pedido y calcular el siguiente número (cíclico 00-99)
    Pedido findTopByOrderByFechaDesc();

    boolean existsByUuid(String uuid);
    java.util.Optional<Pedido> findByUuid(String uuid);
}
