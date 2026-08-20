package com.proyecto.config;

import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataCleanupRunner implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- CHECKING FOR DATA CORRUPTION ---");
        try {
            long countBefore = productRepository.count();
            productRepository.deleteCorrupted();
            long countAfter = productRepository.count();

            if (countBefore > countAfter) {
                System.out.println("FIXED: Deleted " + (countBefore - countAfter)
                        + " corrupted product records (Code=Description duplicates).");
            } else {
                System.out.println("Usage checks passed. No corrupted data found.");
            }
        } catch (Exception e) {
            System.err.println("Error during cleanup: " + e.getMessage());
        }
        System.out.println("------------------------------------");
    }
}
