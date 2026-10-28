package com.lab.secure;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Exp 2.3.1 endpoints: one per RBAC rule type. */
@RestController
public class DemoController {
    private final UserRepository users;
    DemoController(UserRepository users) { this.users = users; }

    @GetMapping("/api/public/hello")
    public Map<String, String> hello() { return Map.of("message", "Hello! This endpoint is PUBLIC."); }

    @GetMapping("/api/user/profile")
    public Map<String, Object> profile(Authentication a) {
        return Map.of("username", a.getName(), "authorities", a.getAuthorities().toString());
    }

    @GetMapping("/api/manager/reports")
    public Map<String, String> reports(Authentication a) { return Map.of("message", "Manager reports visible to " + a.getName()); }

    @GetMapping("/api/admin/users")
    public List<Map<String, Object>> allUsers() {
        return users.findAll().stream()
                .map(u -> Map.<String, Object>of("id", u.id, "username", u.username, "role", u.role)).toList();
    }

    @GetMapping("/api/reports/finance")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Map<String, String> finance() { return Map.of("message", "Finance report (method-level RBAC)"); }
}
