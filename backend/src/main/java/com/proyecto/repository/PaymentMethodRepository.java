package com.proyecto.repository;

import com.proyecto.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByActiveTrueOrderByDisplayOrderAsc();

    Optional<PaymentMethod> findByErpId(Long erpId);

    void deleteByErpId(Long erpId);
}
