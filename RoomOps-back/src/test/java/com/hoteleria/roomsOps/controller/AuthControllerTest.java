package com.hoteleria.roomsOps.controller;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoteleria.roomsOps.config.JwtAuthenticationFilter;
import com.hoteleria.roomsOps.config.JwtUtil;
import com.hoteleria.roomsOps.model.Role;
import com.hoteleria.roomsOps.model.User;
import com.hoteleria.roomsOps.service.UserService;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper mapper;

    @MockBean
    private UserService service;

    @MockBean
    private PasswordEncoder encoder;

    @MockBean
    private JwtUtil jwt;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void loginOk() throws Exception {
        User user = User.builder()
                .id(1L)
                .run("12345678-9")
                .firstName("Admin")
                .lastName("Principal")
                .email("admin@duoc.cl")
                .password("encoded-pass")
                .activo(true)
                .role(Role.builder().id(1L).name("ADMIN").build())
                .build();

        when(service.findUserEmail("admin@duoc.cl")).thenReturn(user);
        when(encoder.matches("admin123", "encoded-pass")).thenReturn(true);
        when(jwt.generadorToken("admin@duoc.cl")).thenReturn("token-jwt-prueba");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "admin@duoc.cl", "password", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-jwt-prueba"))
                .andExpect(jsonPath("$.user.id").value(1L))
                .andExpect(jsonPath("$.user.email").value("admin@duoc.cl"))
                .andExpect(jsonPath("$.user.firstName").value("Admin"))
                .andExpect(jsonPath("$.user.lastName").value("Principal"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void loginBadRequestWhenEmailOrPasswordMissing() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "", "password", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Email y password son requeridos"));

        verify(service, never()).findUserEmail(org.mockito.ArgumentMatchers.anyString());
    }

        @Test
        void loginBadRequestWhenEmailIsNull() throws Exception {
                mockMvc.perform(post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"password\":\"admin123\"}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.mensaje").value("Email y password son requeridos"));

                verify(service, never()).findUserEmail(org.mockito.ArgumentMatchers.anyString());
        }

        @Test
        void loginBadRequestWhenPasswordIsNull() throws Exception {
                mockMvc.perform(post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"email\":\"admin@duoc.cl\"}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.mensaje").value("Email y password son requeridos"));

                verify(service, never()).findUserEmail(org.mockito.ArgumentMatchers.anyString());
        }

        @Test
        void loginBadRequestWhenPasswordIsBlank() throws Exception {
                mockMvc.perform(post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(Map.of("email", "admin@duoc.cl", "password", ""))))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.mensaje").value("Email y password son requeridos"));

                verify(service, never()).findUserEmail(org.mockito.ArgumentMatchers.anyString());
        }

    @Test
    void loginUnauthorizedWhenUserNotFound() throws Exception {
        when(service.findUserEmail("desconocido@duoc.cl")).thenReturn(null);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "desconocido@duoc.cl", "password", "1234"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Credenciales inválidas"));

        verify(encoder, never()).matches(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void loginUnauthorizedWhenPasswordDoesNotMatch() throws Exception {
        User user = User.builder()
                .id(2L)
                .run("99999999-9")
                .firstName("User")
                .lastName("Test")
                .email("user@duoc.cl")
                .password("hash-pass")
                .activo(true)
                .role(Role.builder().id(2L).name("WORKER").build())
                .build();

        when(service.findUserEmail("user@duoc.cl")).thenReturn(user);
        when(encoder.matches("wrong-pass", "hash-pass")).thenReturn(false);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "user@duoc.cl", "password", "wrong-pass"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Credenciales inválidas"));

        verify(jwt, never()).generadorToken(org.mockito.ArgumentMatchers.anyString());
    }
}
