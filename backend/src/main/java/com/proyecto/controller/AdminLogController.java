package com.proyecto.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin/logs")
public class AdminLogController {

    @Value("${logging.file.name:logs/application.log}")
    private String logFilePath;

    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> getRecentLogs(
            @RequestParam(defaultValue = "50") int lines) {

        Map<String, Object> response = new HashMap<>();
        Path path = Paths.get(logFilePath);

        if (!Files.exists(path)) {
            response.put("error", "Log file not found: " + logFilePath);
            return ResponseEntity.status(404).body(response);
        }

        try (Stream<String> lineStream = Files.lines(path)) {
            // This is a simple implementation. For huge files, reading all lines might be
            // heavy,
            // but for "tailing" relatively small active logs it's acceptable.
            // A more robust approach would use RandomAccessFile to seek from the end.
            List<String> allLines = lineStream.collect(Collectors.toList());

            int totalLines = allLines.size();
            int start = Math.max(0, totalLines - lines);
            List<String> recentLines = allLines.subList(start, totalLines);

            response.put("logs", recentLines);
            response.put("total_lines_read", recentLines.size());
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("error", "Error reading log file: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
