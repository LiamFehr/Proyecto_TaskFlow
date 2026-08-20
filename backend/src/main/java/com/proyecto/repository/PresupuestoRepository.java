package com.proyecto.repository;

import com.proyecto.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    List<Presupuesto> findByVendedorEmailOrderByFechaDesc(String vendedorEmail);
}
