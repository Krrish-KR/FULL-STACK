package com.lab.secure;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/** Secure storage of third-party credentials (API keys, passwords). Secrets are AES-encrypted at rest. */
@RestController
@RequestMapping("/api/vault")
public class VaultController {
    record NewSecret(String service, String secret) {}
    private final CredentialRepository repo;
    private final AesService aes;
    VaultController(CredentialRepository repo, AesService aes) { this.repo = repo; this.aes = aes; }

    @PostMapping
    public Map<String, Object> add(@RequestBody NewSecret n, Authentication a) {
        if (n.service() == null || n.service().isBlank() || n.secret() == null || n.secret().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "service and secret are required");
        Credential c = new Credential();
        c.owner = a.getName(); c.service = n.service(); c.encryptedSecret = aes.encrypt(n.secret());
        repo.save(c);
        return Map.of("id", c.id, "service", c.service, "storedAs", c.encryptedSecret);
    }

    /** Listing never returns the plaintext - only a masked hint + the ciphertext as stored in the DB. */
    @GetMapping
    public List<Map<String, Object>> list(Authentication a) {
        return repo.findByOwner(a.getName()).stream().map(c -> {
            String p = aes.decrypt(c.encryptedSecret);
            String masked = "••••••" + (p.length() > 4 ? p.substring(p.length() - 4) : "");
            return Map.<String, Object>of("id", c.id, "service", c.service, "masked", masked, "ciphertext", c.encryptedSecret);
        }).toList();
    }

    @GetMapping("/{id}/reveal")
    public Map<String, Object> reveal(@PathVariable Long id, Authentication a) {
        return Map.of("id", id, "secret", aes.decrypt(mine(id, a).encryptedSecret));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id, Authentication a) {
        repo.delete(mine(id, a));
        return Map.of("message", "Deleted " + id);
    }

    private Credential mine(Long id, Authentication a) {   // owner check: users can only touch their own secrets
        return repo.findById(id).filter(c -> c.owner.equals(a.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }
}
