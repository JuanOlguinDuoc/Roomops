package com.hoteleria.roomsOps.controller;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.mockito.ArgumentMatchers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoteleria.roomsOps.config.JwtAuthenticationFilter;
import com.hoteleria.roomsOps.dto.UserDto;
import com.hoteleria.roomsOps.service.UserService;

// Carga solo la capa web para probar el controlador en aislamiento.

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {

    // Cliente de pruebas HTTP para invocar endpoints sin levantar servidor real.
    @Autowired
    private MockMvc mock;

    // Convierte objetos Java a JSON para enviar cuerpos en POST/PUT.
    @Autowired
    private ObjectMapper mapper;

    @MockBean
    private UserService service;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void userList() throws Exception {
        when(service.getUsers()).thenReturn(List.of(
                UserDto.builder().id(1L).run("12345678-9").firstName("Juan").lastName("Olguin")
                        .email("juan@example.com").password("prueba").role("trabajador").build(),
                UserDto.builder().id(2L).run("98765432-1").firstName("Maria").lastName("Perez")
                        .email("maria@example.com").password("prueba").role("admin").build()));

        // Ejecuta GET /api/v1/users contra el controlador.
        mock.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].firstName").value("Juan"))
                .andExpect(jsonPath("$[0].lastName").value("Olguin"))
                .andExpect(jsonPath("$[0].email").value("juan@example.com"))
                .andExpect(jsonPath("$[1].firstName").value("Maria"))
                .andExpect(jsonPath("$[1].lastName").value("Perez"))
                .andExpect(jsonPath("$[1].email").value("maria@example.com"));
    }

    @Test
    void createUserCreated() throws Exception {
        UserDto request = UserDto.builder().run("12345678-9").firstName("Juan").lastName("Olguin").email("juan@example.com").password("prueba").role("trabajador").build();
        UserDto created = UserDto.builder().id(1L).run("12345678-9").firstName("Juan").lastName("Olguin").email("juan@example.com").role("trabajador").build();
    
        when(service.createUser(ArgumentMatchers.any(UserDto.class))).thenReturn(created);
        mock.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.mensaje").value("Usuario generado correctamente"))
            .andExpect(jsonPath("$.user.id").value(1L))
            .andExpect(jsonPath("$.user.email").value("juan@example.com"))
            .andExpect(jsonPath("$.user.firstName").value("Juan"))
            .andExpect(jsonPath("$.user.lastName").value("Olguin"))
            .andExpect(jsonPath("$.user.role").value("trabajador"));
    }

    @Test
    void createUserBadRequest() throws Exception {
        UserDto request = UserDto.builder().run("12345678-9").firstName("Juan").lastName("Olguin").email("juan@example.com").password("prueba").role("trabajador").build();
        when(service.createUser(ArgumentMatchers.any(UserDto.class))).thenThrow(new IllegalArgumentException("Error al crear usuario"));

        mock.perform(post("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.mensaje").value("Error al crear usuario"))
        .andExpect(jsonPath("$.error").value("Error al crear usuario"));
    }


    @Test
    void userGetByEmail() throws Exception {
        when(service.findByEmail("juan@example.com"))
        .thenReturn(
                UserDto.builder()
                .id(1L)
                .run("12345678-9")
                .firstName("Juan")
                .lastName("Olguin")
                .email("juan@example.com")
                .role("trabajador")
                .build());

        // Ejecuta GET /api/v1/users contra el controlador.
        mock.perform(get("/api/v1/users/by-email")
            .param("email", "juan@example.com"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1L))
        .andExpect(jsonPath("$.run").value("12345678-9"))
        .andExpect(jsonPath("$.firstName").value("Juan"))
        .andExpect(jsonPath("$.lastName").value("Olguin"))
        .andExpect(jsonPath("$.email").value("juan@example.com"))
        .andExpect(jsonPath("$.role").value("trabajador"));
    }

    @Test
    void userGetByEmailNotFound() throws Exception {
        when(service.findByEmail("juan@example.com")).thenReturn(null);

        mock.perform(get("/api/v1/users/by-email")
        .param("email", "juan@example.com"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.mensaje").value("Usuario no encontrado"));
    }

    @Test
    void updateUserOk() throws Exception {
        UserDto request = UserDto.builder().firstName("Juanito").lastName("Olguin").email("juan@example.com")
                .role("trabajador").build();
        UserDto updated = UserDto.builder().id(1L).run("12345678-9").firstName("Juanito").lastName("Olguin")
                .email("juan@example.com").role("trabajador").build();

        when(service.updateUser(1L, request)).thenReturn(updated);

        mock.perform(put("/api/v1/users/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mensaje").value("Usuario actualizado"))
        .andExpect(jsonPath("$.user.id").value(1L))
        .andExpect(jsonPath("$.user.firstName").value("Juanito"));
    }

    @Test
    void updateUserBadRequest() throws Exception {
        UserDto request = UserDto.builder().firstName("Juanito").build();
        when(service.updateUser(1L, request)).thenThrow(new IllegalArgumentException("User not found"));

        mock.perform(put("/api/v1/users/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.mensaje").value("Error al actualizar usuario"))
        .andExpect(jsonPath("$.error").value("User not found"));
    }

    @Test
    void cambiarEstadoOk() throws Exception {
        doNothing().when(service).updateEstado(1L, false);

        mock.perform(patch("/api/v1/users/1/estado").param("activo", "false"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mensaje").value("Estado de usuario actualizado"));
    }

    @Test
    void cambiarEstadoNotFound() throws Exception {
        doThrow(new IllegalArgumentException("User not found")).when(service).updateEstado(99L, false);

        mock.perform(patch("/api/v1/users/99/estado").param("activo", "false"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.mensaje").value("Usuario no encontrado"));
    }

    @Test
    void cambiarEstadoBadRequest() throws Exception {
        doThrow(new IllegalArgumentException("Error de negocio")).when(service).updateEstado(10L, false);

        mock.perform(patch("/api/v1/users/10/estado").param("activo", "false"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.mensaje").value("Error al actualizar estado de usuario"))
        .andExpect(jsonPath("$.error").value("Error de negocio"));
    }

    @Test
    void cambiarEstadoErrorWhenExceptionMessageIsNull() throws Exception {
        doThrow(new RuntimeException((String) null)).when(service).updateEstado(12L, false);

        mock.perform(patch("/api/v1/users/12/estado").param("activo", "false"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.mensaje").value("Error al actualizar estado de usuario"));
    }

    @Test
    void patchUserOk() throws Exception {
        Map<String, Object> updates = new HashMap<>();
        updates.put("id", 99L);
        updates.put("run", "11111111-1");
        updates.put("role", "admin");
        updates.put("firstName", "Pedro");

        UserDto patched = UserDto.builder().id(1L).run("12345678-9").firstName("Pedro").lastName("Olguin")
                .email("juan@example.com").role("trabajador").build();

        when(service.patchUser(org.mockito.ArgumentMatchers.eq(1L), ArgumentMatchers.<Map<String, Object>>any()))
                .thenReturn(patched);

        mock.perform(patch("/api/v1/users/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(updates)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mensaje").value("Usuario parchado"))
        .andExpect(jsonPath("$.user.firstName").value("Pedro"));

        verify(service).patchUser(org.mockito.ArgumentMatchers.eq(1L), argThat(map ->
                !map.containsKey("id") && !map.containsKey("run") && !map.containsKey("role")
                && "Pedro".equals(map.get("firstName"))));
    }

    @Test
    void patchUserBadRequest() throws Exception {
        Map<String, Object> updates = Map.of("firstName", "Pedro");

        when(service.patchUser(org.mockito.ArgumentMatchers.eq(1L), ArgumentMatchers.<Map<String, Object>>any()))
                .thenThrow(new IllegalArgumentException("User not found"));

        mock.perform(patch("/api/v1/users/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(updates)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.mensaje").value("Error al parchado usuario"))
        .andExpect(jsonPath("$.error").value("User not found"));
    }
}
