package com.hoteleria.roomsOps.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

 @Bean
 public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwt) throws Exception {
  http
    .csrf(csrf -> csrf.disable())
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
      .requestMatchers(
        "/api/v1/auth/**",
        "/database/**",
        "/h2-console/**",
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/swagger-ui.html")
      .permitAll()
      .requestMatchers(HttpMethod.GET, "/api/v1/users/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.POST, "/api/v1/users/**")
      .hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.PUT, "/api/v1/users/**")
      .hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.PATCH, "/api/v1/users/**")
      .hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.DELETE, "/api/v1/users/**")
      .hasRole("ADMINISTRADOR")

      .requestMatchers(HttpMethod.GET, "/api/v1/roles/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.POST, "/api/v1/roles/**")
      .hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.PUT, "/api/v1/roles/**")
      .hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.DELETE, "/api/v1/roles/**")
      .hasRole("ADMINISTRADOR")

      .requestMatchers(HttpMethod.GET, "/api/v1/apartments/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR", "TRABAJADOR")
      .requestMatchers(HttpMethod.POST, "/api/v1/apartments/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.PUT, "/api/v1/apartments/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.PATCH, "/api/v1/apartments/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")

      .requestMatchers(HttpMethod.GET, "/api/v1/tasks/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR", "TRABAJADOR")
      .requestMatchers(HttpMethod.PUT, "/api/v1/tasks/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR", "TRABAJADOR")
      .requestMatchers(HttpMethod.POST, "/api/v1/tasks/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.DELETE, "/api/v1/tasks/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")

      .requestMatchers(HttpMethod.GET, "/api/v1/status/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR", "TRABAJADOR")
      .requestMatchers(HttpMethod.POST, "/api/v1/status/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.PUT, "/api/v1/status/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")
      .requestMatchers(HttpMethod.DELETE, "/api/v1/status/**")
      .hasAnyRole("ADMINISTRADOR", "SUPERVISOR")

      .anyRequest().authenticated())
    .headers(headers -> headers.frameOptions(frame -> frame.disable()))
    .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class);

  return http.build();
 }

 @Bean
 public PasswordEncoder passwordEncoder() {
  return new BCryptPasswordEncoder();
 }

 @Bean
 public AuthenticationManager authenticationManager(
   AuthenticationConfiguration authenticationConfiguration) throws Exception {
  return authenticationConfiguration.getAuthenticationManager();
 }

 @Bean
 public CorsConfigurationSource corsConfigurationSource() {
  CorsConfiguration configuration = new CorsConfiguration();
  // Allow requests from the frontend; use origin patterns to be flexible in dev
  configuration
    .setAllowedOriginPatterns(List.of("*"));
  configuration.setAllowedMethods(List.of("GET", "PATCH", "POST", "PUT", "DELETE", "OPTIONS"));
  // Allow all request headers the browser may send
  configuration.setAllowedHeaders(List.of("*"));
  configuration.setExposedHeaders(List.of("Authorization"));
  configuration.setAllowCredentials(true);

  UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
  source.registerCorsConfiguration("/**", configuration);
  return source;
 }
}
