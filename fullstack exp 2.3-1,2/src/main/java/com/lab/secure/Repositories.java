package com.lab.secure;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

interface UserRepository extends JpaRepository<User, Long> { Optional<User> findByUsername(String u); }
interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String h);
    List<RefreshToken> findByUsername(String u);
}
interface CredentialRepository extends JpaRepository<Credential, Long> { List<Credential> findByOwner(String o); }
interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {
    List<LoginAudit> findAllByOrderByLoginTimeDesc();
}
