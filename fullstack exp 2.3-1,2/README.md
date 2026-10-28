# Lab 2.3 – Combined (Exp 2.3.1 + Exp 2.3.2) – ONE server, ONE port

## Run
Requirements: JDK 17+, Maven 3.8+, internet on first run (downloads dependencies).
```
mvn spring-boot:run        (or ./run.sh on Linux/Mac, run.bat on Windows)
```
Open **http://localhost:8080**  - the console has two tabs:
* **Exp 2.3.1** - JWT inspector, role-based endpoints, tamper test, automatic RBAC matrix
* **Exp 2.3.2** - token refresh/rotation/replay attack, AES-encrypted credential vault, AES playground

Seeded logins: `user/user123`, `manager/manager123`, `admin/admin123` (or register your own with a chosen role).
H2 DB console: http://localhost:8080/h2-console  (JDBC `jdbc:h2:mem:seclab`, user `sa`, empty password)

## How the two experiments fit together
Login returns an **access JWT** (120 s, carries the `role` claim - Exp 2.3.1) and a **refresh token** (10 min, hashed in DB, rotated - Exp 2.3.2).
The same `JwtAuthFilter` + `SecurityConfig` protect both the RBAC endpoints and the vault.

| File | Role |
|---|---|
| `SecurityConfig`, `JwtAuthFilter` | Stateless Spring Security chain, auth filter, RBAC rules (2.3.1) |
| `DemoController` | public / user / manager / admin / @PreAuthorize endpoints (2.3.1) |
| `TokenService` | JWT creation+validation, refresh-token rotation, reuse detection (2.3.1 + 2.3.2) |
| `AesService`, `CryptoController` | AES-256-GCM encryption (2.3.2) |
| `VaultController` | encrypted third-party credential storage (2.3.2) |
| `AuthController` | register / login / refresh / logout |

## RBAC expectation table
| Endpoint | Anonymous | USER | MANAGER | ADMIN |
|---|---|---|---|---|
| /api/public/hello | 200 | 200 | 200 | 200 |
| /api/user/profile | 401 | 200 | 200 | 200 |
| /api/manager/reports | 401 | 403 | 200 | 200 |
| /api/admin/users | 401 | 403 | 403 | 200 |
| /api/reports/finance (@PreAuthorize) | 401 | 403 | 200 | 200 |

## Practical checklist
1. Login as user - inspect token - call each endpoint - run the RBAC matrix (all green) - press Tamper (401).
2. Tab 2.3.2: add a credential, Reveal it, check `SELECT * FROM credentials` in H2 (ciphertext only).
3. AES playground: encrypt twice (different output), edit one char and decrypt (tamper detected).
4. Wait for access token EXPIRED -> 401 -> Refresh. Refresh, then Replay old token -> all sessions revoked.
5. Logout -> refresh token revoked.

Change settings (token lifetimes, keys) in `src/main/resources/application.properties`; keys can be overridden with env vars `JWT_SECRET` and `AES_KEY` (32 bytes, Base64).
