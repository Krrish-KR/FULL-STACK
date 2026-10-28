package com.lab.secure;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Token lifecycle:
 *  - ACCESS token  : short-lived JWT, stateless, sent on every API call.
 *  - REFRESH token : long-lived random string, stored HASHED in DB, ROTATED on every use,
 *                    revocable (logout) and reuse of an old one revokes ALL sessions of that user.
 */
@Service
public class TokenService {
    private final SecretKey key;
    private final long accessMs, refreshMs;
    private final RefreshTokenRepository repo;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();

    TokenService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.access-ms}") long accessMs,
                 @Value("${app.jwt.refresh-ms}") long refreshMs, RefreshTokenRepository repo, UserRepository users) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessMs = accessMs; this.refreshMs = refreshMs; this.repo = repo; this.users = users;
    }

    public Claims parse(String jwt) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt).getPayload(); }

    Map<String, Object> issuePair(User u) {
        long now = System.currentTimeMillis();
        String access = Jwts.builder().subject(u.username).claim("role", u.role)
                .issuedAt(new Date(now)).expiration(new Date(now + accessMs)).signWith(key).compact();
        byte[] b = new byte[32];
        random.nextBytes(b);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        RefreshToken rt = new RefreshToken();
        rt.tokenHash = sha256(raw); rt.username = u.username; rt.expiresAt = Instant.now().plusMillis(refreshMs);
        repo.save(rt);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("accessToken", access); m.put("refreshToken", raw);
        m.put("accessExpiresInSec", accessMs / 1000); m.put("refreshExpiresInSec", refreshMs / 1000);
        m.put("username", u.username);
        return m;
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Map<String, Object> rotate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token must not be empty");
        }
        RefreshToken rt = repo.findByTokenHash(sha256(raw))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token - session not found"));
        if (rt.revoked) {   // an already-used token came back => likely stolen
            repo.findByUsername(rt.username).forEach(t -> t.revoked = true);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token REUSE detected - all sessions revoked");
        }
        if (rt.expiresAt.isBefore(Instant.now()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired - login again");
        rt.revoked = true;   // rotation: old one is dead
        User user = users.findByUsername(rt.username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found - login again"));
        return issuePair(user);
    }

    @Transactional
    public void revoke(String raw) { repo.findByTokenHash(sha256(raw == null ? "" : raw)).ifPresent(t -> t.revoked = true); }

    static String sha256(String s) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
