package com.hoteleria.roomsOps.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;

/**
 * Utilidad para generar, validar y extraer información de JWT tokens.
 * 
 * Uso:
 * - generadorToken(String email): Genera un nuevo token JWT para un usuario
 * - validacionToken(String token): Valida que el token sea válido y no esté expirado
 * - obtenerCorreo(String token): Extrae el email (subject) del token
 * - extraerExpiracion(String token): Obtiene la fecha de expiración del token
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpiration;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtUtil.class);

    /**
     * Obtiene la clave secreta para firmar y verificar tokens
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Genera un JWT firmado con el email del usuario como subject.
     * El token incluye:
     * - subject (email del usuario)
     * - fecha de emisión
     * - fecha de expiración (por defecto 1 hora)
     * 
     * @param email Email del usuario
     * @return JWT token como String
     */
    public String generadorToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extrae el email (subject) del payload del token.
     * Si el token está corrupto o expirado, JJWT lanza una excepción.
     * 
     * @param token JWT token
     * @return Email del usuario
     */
    public String obtenerCorreo(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Valida que el token tenga firma correcta y no haya expirado.
     * 
     * @param token JWT token
     * @return true si el token es válido, false si hay algún error
     */
    public boolean validacionToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            logger.debug("Token validation failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * Extrae la fecha de expiración del token.
     * 
     * @param token JWT token
     * @return Fecha de expiración
     */
    public Date extraerExpiracion(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }
}