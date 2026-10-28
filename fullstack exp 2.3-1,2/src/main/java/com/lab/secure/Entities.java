package com.lab.secure;

import jakarta.persistence.*;
import java.time.Instant;

class Entities {}

@Entity @Table(name = "users")
class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(unique = true, nullable = false) public String username;
    @Column(nullable = false) public String password;   // BCrypt hash
    @Column(nullable = false) public String role = "USER";
    User() {}
    User(String u, String p, String r) { username = u; password = p; role = r; }
}

@Entity @Table(name = "refresh_tokens")
class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(unique = true, nullable = false) public String tokenHash;   // SHA-256, never the raw token
    public String username;
    public Instant expiresAt;
    public boolean revoked;
}

@Entity @Table(name = "credentials")
class Credential {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    public String owner;
    public String service;
    @Column(length = 2000) public String encryptedSecret;   // Base64(IV || AES-GCM ciphertext+tag)
}

@Entity @Table(name = "login_audit")
class LoginAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false) public String username;
    public String role;
    @Column(nullable = false) public Instant loginTime;
    public String ipAddress;
    public String status;   // "SUCCESS" or "FAILED"
    LoginAudit() {}
    LoginAudit(String u, String r, Instant t, String ip, String s) {
        this.username = u; this.role = r; this.loginTime = t; this.ipAddress = ip; this.status = s;
    }
}
