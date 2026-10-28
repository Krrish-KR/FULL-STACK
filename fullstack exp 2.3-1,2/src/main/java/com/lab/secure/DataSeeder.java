package com.lab.secure;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seed(UserRepository repo, PasswordEncoder enc, LoginAuditRepository loginAudits) {
        return args -> {
            repo.save(new User("user", enc.encode("user123"), "USER"));
            repo.save(new User("manager", enc.encode("manager123"), "MANAGER"));
            repo.save(new User("admin", enc.encode("admin123"), "ADMIN"));

            java.time.Instant now = java.time.Instant.now();
            loginAudits.save(new LoginAudit("system_init", "SYSTEM", now.minusSeconds(3600), "127.0.0.1", "SUCCESS"));
            loginAudits.save(new LoginAudit("admin", "ADMIN", now.minusSeconds(1800), "127.0.0.1", "SUCCESS"));
            loginAudits.save(new LoginAudit("manager", "MANAGER", now.minusSeconds(600), "127.0.0.1", "SUCCESS"));
        };
    }
}
