package com.hoteleria.roomsOps.config;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.hoteleria.roomsOps.model.User;
import com.hoteleria.roomsOps.service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        // Skip filter for auth endpoints (login/register) and H2 console
        if (path.startsWith("/api/v1/auth")
            || path.startsWith("/h2-console")
            || path.startsWith("/swagger-ui")
            || path.startsWith("/v3/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        String email = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                email = jwtUtil.obtenerCorreo(jwt);
            } catch (Exception e) {
                logger.warn("Error obteniendo email del token", e);
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Validar token primero; evitar cargar usuario si el token es inválido
            if (jwt != null && jwtUtil.validacionToken(jwt)) {
                try {
                    User user = userService.findUserEmail(email);
                    
                    if (user != null && email.equals(user.getEmail())) {
                        // Construir authorities desde el rol del usuario
                        Collection<GrantedAuthority> authorities = buildAuthorities(user);
                        
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        
                        logger.debug("Authentication configurada para: " + email + " con authorities: " + authorities);
                    }
                } catch (Exception ex) {
                    // Usuario no encontrado u otro error - log y continuar sin autenticación
                    logger.warn("Usuario no encontrado o error cargando usuario para email: " + email, ex);
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Construye las authorities del usuario basado en su rol
     */
    private Collection<GrantedAuthority> buildAuthorities(User user) {
        if (user.getRole() != null && user.getRole().getName() != null) {
            String roleName = "ROLE_" + user.getRole().getName().toUpperCase();
            return Collections.singleton(new SimpleGrantedAuthority(roleName));
        }
        return Collections.emptyList();
    }

}
