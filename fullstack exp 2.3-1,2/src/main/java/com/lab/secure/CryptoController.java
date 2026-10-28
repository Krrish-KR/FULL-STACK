package com.lab.secure;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/** Playground to see AES-GCM in action (requires a valid access token). */
@RestController
@RequestMapping("/api/crypto")
public class CryptoController {
    record Text(String text) {}
    record LinkData(String link, String data) {}

    private final AesService aes;
    private final ObjectMapper mapper = new ObjectMapper();

    CryptoController(AesService aes) { this.aes = aes; }

    @PostMapping("/encrypt")
    public Map<String, String> encrypt(@RequestBody(required = false) Text t) {
        if (t == null || t.text() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Input text is required");
        }
        return Map.of("ciphertext", aes.encrypt(t.text()));
    }

    @PostMapping("/decrypt")
    public Map<String, String> decrypt(@RequestBody(required = false) Text t) {
        if (t == null || t.text() == null || t.text().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ciphertext is required");
        }
        return Map.of("plaintext", aes.decrypt(t.text()));
    }

    @PostMapping("/encrypt-link")
    public Map<String, Object> encryptLink(@RequestBody(required = false) LinkData ld) {
        if (ld == null || ld.link() == null || ld.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both 'link' and 'data' fields are required");
        }
        try {
            String jsonPayload = mapper.writeValueAsString(Map.of("link", ld.link(), "data", ld.data(), "timestamp", System.currentTimeMillis()));
            String ciphertext = aes.encrypt(jsonPayload);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("link", ld.link());
            resp.put("data", ld.data());
            resp.put("ciphertext", ciphertext);
            resp.put("algorithm", "AES-256-GCM");
            resp.put("nonceBytes", 12);
            resp.put("authTagBits", 128);
            return resp;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Encryption failed: " + e.getMessage());
        }
    }

    @PostMapping("/decrypt-link")
    public Map<String, Object> decryptLink(@RequestBody(required = false) Text t) {
        if (t == null || t.text() == null || t.text().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ciphertext is required");
        }
        try {
            String decryptedJson = aes.decrypt(t.text());
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = mapper.readValue(decryptedJson, Map.class);
            Map<String, Object> resp = new LinkedHashMap<>(parsed);
            resp.put("verified", true);
            resp.put("algorithm", "AES-256-GCM");
            return resp;
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decryption or payload parsing failed: " + e.getMessage());
        }
    }
}


