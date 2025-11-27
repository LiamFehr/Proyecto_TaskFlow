package com.proyecto.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.proyecto.dto.PedidoDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PedidoFileService {

    @Value("${taskflow.pedidos.pendientes}")
    private String pendientesPath;

    private final ObjectMapper objectMapper;

    public PedidoFileService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(pendientesPath));
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio de pedidos", e);
        }
    }

    public void guardarPedido(PedidoDTO pedido) throws IOException {
        String filename = pedido.getCliente().replaceAll("[^a-zA-Z0-9.-]", "_") + ".json";
        Path path = Paths.get(pendientesPath, filename);
        objectMapper.writeValue(path.toFile(), pedido);
    }

    public List<String> listarPedidos() {
        File folder = new File(pendientesPath);
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".json"));

        if (files == null) {
            return Collections.emptyList();
        }

        return Arrays.stream(files)
                .map(File::getName)
                .collect(Collectors.toList());
    }

    public PedidoDTO leerPedido(String filename) throws IOException {
        Path path = Paths.get(pendientesPath, filename);
        return objectMapper.readValue(path.toFile(), PedidoDTO.class);
    }

    public Resource descargar(String filename) throws MalformedURLException {
        Path path = Paths.get(pendientesPath, filename);
        Resource resource = new UrlResource(path.toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("No se puede leer el archivo: " + filename);
        }
    }

    public Resource descargarTxt(String filename) throws IOException {
        PedidoDTO pedido = leerPedido(filename);
        StringBuilder sb = new StringBuilder();
        sb.append("Cliente: ").append(pedido.getCliente()).append("\n");
        sb.append("Fecha: ").append(pedido.getFecha()).append("\n");
        sb.append("----------------------------------------\n");

        for (var prod : pedido.getProductos()) {
            sb.append(prod.getCodigo()).append(" - ")
                    .append(prod.getDescripcion()).append(" x")
                    .append(prod.getCantidad()).append("\n");
        }

        return new org.springframework.core.io.ByteArrayResource(
                sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public boolean eliminarPedido(String filename) {
        try {
            Path filePath = Paths.get(pendientesPath, filename);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Scheduled(fixedDelay = 600000) // 10 minutes
    public void limpiarPedidosViejos() {
        File folder = new File(pendientesPath);
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".json"));

        if (files != null) {
            long now = System.currentTimeMillis();
            long tenMinutesInMillis = 10 * 60 * 1000;

            for (File file : files) {
                if (now - file.lastModified() > tenMinutesInMillis) {
                    file.delete();
                }
            }
        }
    }
}
