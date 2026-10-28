package com.lab.secure;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    record Creds(String username, String password, String role) {}
    record Refresh(String refreshToken) {}

    private final UserRepository users;
    private final PasswordEncoder enc;
    private final TokenService tokens;
    private final LoginAuditRepository loginAudits;

    AuthController(UserRepository users, PasswordEncoder enc, TokenService tokens, LoginAuditRepository loginAudits) {
        this.users = users; this.enc = enc; this.tokens = tokens; this.loginAudits = loginAudits;
    }

    /** LAB ONLY: caller picks the role so RBAC can be tested. Never allow this in production. */
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody Creds c) {
        if (c.username() == null || c.username().isBlank() || c.password() == null || c.password().length() < 4)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username required, password min 4 chars");
        if (users.findByUsername(c.username()).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        String role = c.role() == null ? "USER" : c.role().toUpperCase();
        if (!Set.of("USER", "MANAGER", "ADMIN").contains(role))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role must be USER, MANAGER or ADMIN");
        users.save(new User(c.username(), enc.encode(c.password()), role));
        return Map.of("message", "Registered " + c.username(), "role", role);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Creds c, HttpServletRequest req) {
        String ip = getClientIp(req);
        var opt = users.findByUsername(c.username() != null ? c.username() : "").filter(x -> enc.matches(c.password() != null ? c.password() : "", x.password));
        if (opt.isEmpty()) {
            loginAudits.save(new LoginAudit(c.username() != null ? c.username() : "anonymous", "NONE", Instant.now(), ip, "FAILED"));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials");
        }
        User u = opt.get();
        loginAudits.save(new LoginAudit(u.username, u.role, Instant.now(), ip, "SUCCESS"));
        return tokens.issuePair(u);
    }

    @GetMapping("/history")
    public List<Map<String, Object>> history() {
        return loginAudits.findAllByOrderByLoginTimeDesc().stream().limit(50).map(a -> Map.<String, Object>of(
                "id", a.id,
                "username", a.username,
                "role", a.role != null ? a.role : "NONE",
                "loginTime", a.loginTime.toString(),
                "ipAddress", a.ipAddress != null ? a.ipAddress : "127.0.0.1",
                "status", a.status != null ? a.status : "SUCCESS"
        )).toList();
    }

    @PostMapping("/refresh")
    public Map<String, Object> refresh(@RequestBody(required = false) Refresh r) {
        return tokens.rotate(r != null ? r.refreshToken() : null);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@RequestBody Refresh r) {
        tokens.revoke(r.refreshToken());
        return Map.of("message", "Refresh token revoked");
    }

    private String getClientIp(HttpServletRequest req) {
        if (req == null) return "127.0.0.1";
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) return xf.split(",")[0].trim();
        return req.getRemoteAddr() != null ? req.getRemoteAddr() : "127.0.0.1";
    }
}

