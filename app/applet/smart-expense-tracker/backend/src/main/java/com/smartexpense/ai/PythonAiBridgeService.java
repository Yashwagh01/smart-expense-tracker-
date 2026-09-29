package com.smartexpense.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
public class PythonAiBridgeService {

    private static final Logger log = LoggerFactory.getLogger(PythonAiBridgeService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${python.executable:python3}")
    private String pythonExecutable;

    @Value("${python.scripts.path:../ai}")
    private String scriptsBasePath;

    /**
     * Executes a specific Python AI script with a JSON payload via stdin
     * and parses stdout into a Jackson JsonNode.
     */
    public JsonNode executePythonScript(String scriptName, Object payload) {
        File scriptFile = new File(scriptsBasePath, scriptName);
        if (!scriptFile.exists()) {
            // Also try relative to working directory or classpath
            scriptFile = new File("smart-expense-tracker/ai", scriptName);
            if (!scriptFile.exists()) {
                scriptFile = new File("ai", scriptName);
            }
        }

        try {
            String jsonInput = objectMapper.writeValueAsString(payload);
            
            ProcessBuilder processBuilder = new ProcessBuilder(
                    pythonExecutable,
                    scriptFile.getAbsolutePath()
            );
            processBuilder.redirectErrorStream(false);
            
            Process process = processBuilder.start();

            // Write JSON input to Python process stdin
            try (OutputStream os = process.getOutputStream();
                 BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8))) {
                writer.write(jsonInput);
                writer.flush();
            }

            // Read Python process stdout
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            // Read stderr in case of issue
            StringBuilder errorOutput = new StringBuilder();
            try (BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = errReader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(15, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.error("Python script {} timed out", scriptName);
                return createErrorJson("AI analysis timed out after 15 seconds.");
            }

            if (process.exitValue() != 0) {
                log.warn("Python script {} returned non-zero code {}: {}", scriptName, process.exitValue(), errorOutput);
            }

            String outputStr = output.toString().trim();
            if (outputStr.isEmpty()) {
                return createErrorJson("AI service returned empty response. " + errorOutput);
            }

            return objectMapper.readTree(outputStr);

        } catch (Exception e) {
            log.error("Failed to execute Python AI script {}", scriptName, e);
            return createErrorJson("AI service is currently unavailable. Please try again later.");
        }
    }

    private JsonNode createErrorJson(String message) {
        try {
            return objectMapper.readTree(String.format("{\"success\":false,\"status\":\"ERROR\",\"message\":\"%s\"}", message.replace("\"", "\\\"")));
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }
}
