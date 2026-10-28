package com.lab.secure;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Reads "Authorization: Bearer <jwt>", validates it, puts username + ROLE_x into the SecurityContext.
 *  Not a @Component on purpose: it is created inside SecurityConfig so it runs only in the security chain. */
public class JwtAuthFilter extends OncePerRequestFilter {
    private final TokenService tokens;
    public JwtAuthFilter(TokenService tokens) { this.tokens = tokens; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            try {
                var c = tokens.parse(h.substring(7));
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                        c.getSubject(), null, List.of(new SimpleGrantedAuthority("ROLE_" + c.get("role", String.class)))));
            } catch (ExpiredJwtException e) {
                req.setAttribute("jwt_error", "Access token expired - use the refresh token");
            } catch (JwtException | IllegalArgumentException e) {
                req.setAttribute("jwt_error", "Invalid token (bad signature or format)");
            }
        }
        chain.doFilter(req, res);
    }
}
