package com.hoteleria.roomsOps.controller;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoteleria.roomsOps.config.JwtAuthenticationFilter;
import com.hoteleria.roomsOps.dto.RoleDto;
import com.hoteleria.roomsOps.service.RoleService;

// Carga solo la capa web para probar el controlador en aislamiento.
@WebMvcTest(RoleController.class)
@AutoConfigureMockMvc(addFilters = false)
class RoleControllerTest {

    // Cliente de pruebas HTTP para invocar endpoints sin levantar servidor real.
    @Autowired
    private MockMvc mockMvc;

    // Convierte objetos Java a JSON para enviar cuerpos en POST/PUT.
    @Autowired
    private ObjectMapper objectMapper;

    // Mock de la dependencia del controlador para controlar respuestas del servicio.
    @MockBean
    private RoleService roleService;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void listRoles() throws Exception {
        // Simula que el servicio devuelve dos roles.
        when(roleService.getRoles()).thenReturn(List.of(
                RoleDto.builder().id(1L).name("ADMIN").build(),
                RoleDto.builder().id(2L).name("TRABAJADOR").build()));

        // Ejecuta GET /api/v1/roles contra el controlador.
        mockMvc.perform(get("/api/v1/roles"))
                // Verifica estado HTTP 200.
                .andExpect(status().isOk())
                // Verifica contenido del arreglo JSON de respuesta.
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("ADMIN"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("TRABAJADOR"));
    }

    @Test
    void createRoleCreated() throws Exception {
        // DTO que enviamos como body del POST.
        RoleDto request = RoleDto.builder().name("SUPERVISOR").build();
        // DTO que simula devolver el servicio al crear exitosamente.
        RoleDto created = RoleDto.builder().id(10L).name("SUPERVISOR").build();

        // Configura el comportamiento del mock para cualquier RoleDto recibido.
        when(roleService.createRole(org.mockito.ArgumentMatchers.any(RoleDto.class))).thenReturn(created);

        // Ejecuta POST enviando JSON y verifica respuesta de creación.
        mockMvc.perform(post("/api/v1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        // Serializa el DTO a JSON.
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensaje").value("Rol generado correctamente"))
                .andExpect(jsonPath("$.role.id").value(10))
                .andExpect(jsonPath("$.role.name").value("SUPERVISOR"));
    }

    @Test
    void createRoleBadRequest() throws Exception {
        // DTO con nombre que provocará error simulado.
        RoleDto request = RoleDto.builder().name("ADMIN").build();
        // Simula excepción de negocio del servicio.
        when(roleService.createRole(org.mockito.ArgumentMatchers.any(RoleDto.class)))
                .thenThrow(new IllegalArgumentException("Nombre duplicado"));

        // Ejecuta POST y valida respuesta HTTP 400 con mensaje de error.
        mockMvc.perform(post("/api/v1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al crear rol"))
                .andExpect(jsonPath("$.error").value("Nombre duplicado"));
    }

    @Test
    void getRoleOk() throws Exception {
        // Simula que existe un rol para el id consultado.
        RoleDto role = RoleDto.builder().id(5L).name("ADMIN").build();
        when(roleService.findById(5L)).thenReturn(role);

        // Ejecuta GET por id y verifica respuesta 200 con body esperado.
        mockMvc.perform(get("/api/v1/roles/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.name").value("ADMIN"));
    }

    @Test
    void getRoleNotFound() throws Exception {
        // Simula ausencia del rol en el servicio.
        when(roleService.findById(99L)).thenReturn(null);

        // Ejecuta GET por id inexistente y verifica 404.
        mockMvc.perform(get("/api/v1/roles/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("Rol no encontrado"));
    }

    @Test
    void updateRoleOk() throws Exception {
        // Request de actualización.
        RoleDto request = RoleDto.builder().name("NEW_NAME").build();
        // Respuesta simulada del servicio.
        RoleDto updated = RoleDto.builder().id(7L).name("NEW_NAME").build();

        // Define resultado exitoso del mock en actualización.
        when(roleService.updateRole(org.mockito.ArgumentMatchers.eq(7L),
                org.mockito.ArgumentMatchers.any(RoleDto.class))).thenReturn(updated);

        // Ejecuta PUT y valida respuesta 200 con payload de rol actualizado.
        mockMvc.perform(put("/api/v1/roles/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Rol actualizado"))
                .andExpect(jsonPath("$.role.id").value(7))
                .andExpect(jsonPath("$.role.name").value("NEW_NAME"));
    }

    @Test
    void updateRoleBadRequest() throws Exception {
        // Request que provoca error de validación simulado.
        RoleDto request = RoleDto.builder().name("FAIL").build();

        // Simula excepción de negocio para la actualización.
        when(roleService.updateRole(org.mockito.ArgumentMatchers.eq(8L),
                org.mockito.ArgumentMatchers.any(RoleDto.class)))
                .thenThrow(new IllegalArgumentException("Dato invalido"));

        // Ejecuta PUT y verifica estado 400 con mensaje de error.
        mockMvc.perform(put("/api/v1/roles/8")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al actualizar rol"))
                .andExpect(jsonPath("$.error").value("Dato invalido"));
    }

    @Test
    void deleteRoleOk() throws Exception {
        // Simula eliminación exitosa (sin excepción).
        doNothing().when(roleService).deleteRole(9L);

        // Ejecuta DELETE y valida respuesta 200.
        mockMvc.perform(delete("/api/v1/roles/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Rol eliminado"));
    }

    @Test
    void deleteRoleNotFound() throws Exception {
        // Simula que el rol no existe al eliminar.
        doThrow(new IllegalArgumentException("Rol no encontrado")).when(roleService).deleteRole(100L);

        // Ejecuta DELETE y verifica estado 404 con mensaje esperado.
        mockMvc.perform(delete("/api/v1/roles/100"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("Rol no encontrado"))
                .andExpect(jsonPath("$.error").value("Rol no encontrado"));
    }

    @Test
    void deleteRoleBadRequest() throws Exception {
        // Simula error genérico de negocio al eliminar.
        doThrow(new IllegalArgumentException("error de negocio")).when(roleService).deleteRole(101L);

        // Ejecuta DELETE y valida estado 400 con detalle del error.
        mockMvc.perform(delete("/api/v1/roles/101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al eliminar rol"))
                .andExpect(jsonPath("$.error").value("error de negocio"));
    }

    @Test
    void deleteRoleErrorWithNullMessage() throws Exception {
        doThrow(new IllegalArgumentException((String) null))
                .when(roleService).deleteRole(200L);

        mockMvc.perform(delete("/api/v1/roles/200"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al eliminar rol"));
        }

}
