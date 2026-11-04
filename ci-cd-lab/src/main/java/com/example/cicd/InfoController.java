package com.example.cicd;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

/** Lets the canary demo see which version answered a request. */
@RestController
public class InfoController {
    @Value("${app.version:1.0.0}") private String version;
    @GetMapping("/api/info") public Map<String, String> info() { return Map.of("version", version); }
}
