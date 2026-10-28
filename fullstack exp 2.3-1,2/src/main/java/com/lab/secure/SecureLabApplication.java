package com.lab.secure;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SecureLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecureLabApplication.class, args);
        System.out.println("\n>>> Lab 2.3 (2.3.1 + 2.3.2) running at http://localhost:8080\n");
    }
}
