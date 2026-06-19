package com.hoteleria.roomsOps.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import com.hoteleria.roomsOps.dto.StatusDto;
import com.hoteleria.roomsOps.service.StatusService;

@WebMvcTest(StatusController.class)
@AutoConfigureMockMvc(addFilters = false)
class StatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper mapper;

    @MockBean
    private StatusService service;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void listStatusOk() throws Exception {
        when(service.getAllStatus()).thenReturn(List.of(
                StatusDto.builder().id(1L).nombre("Disponible").build(),
                StatusDto.builder().id(2L).nombre("Ocupado").build()));

        mockMvc.perform(get("/api/v1/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombre").value("Disponible"))
                .andExpect(jsonPath("$[1].nombre").value("Ocupado"));
    }

    @Test
    void createStatusCreated() throws Exception {
        StatusDto request = StatusDto.builder().nombre("Disponible").build();
        StatusDto created = StatusDto.builder().id(10L).nombre("Disponible").build();

        when(service.createStatus(any(StatusDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Estado generado correctamente"))
                .andExpect(jsonPath("$.status.id").value(10))
                .andExpect(jsonPath("$.status.nombre").value("Disponible"));
    }

    @Test
    void createStatusBadRequest() throws Exception {
        StatusDto request = StatusDto.builder().nombre("X").build();
        when(service.createStatus(any(StatusDto.class))).thenThrow(new IllegalArgumentException("Error de validacion"));

        mockMvc.perform(post("/api/v1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al crear estado"))
                .andExpect(jsonPath("$.error").value("Error de validacion"));
    }

    @Test
    void getStatusOk() throws Exception {
        when(service.getStatusById(1L)).thenReturn(StatusDto.builder().id(1L).nombre("Disponible").build());

        mockMvc.perform(get("/api/v1/status/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Disponible"));
    }

    @Test
    void getStatusNotFound() throws Exception {
        when(service.getStatusById(99L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/status/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Estado no encontrado"));
    }

    @Test
    void updateStatusOk() throws Exception {
        StatusDto request = StatusDto.builder().nombre("Mantenimiento").build();
        StatusDto updated = StatusDto.builder().id(1L).nombre("Mantenimiento").build();

        when(service.updateStatus(eq(1L), any(StatusDto.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/status/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Estado actualizado"))
                .andExpect(jsonPath("$.status.id").value(1))
                .andExpect(jsonPath("$.status.nombre").value("Mantenimiento"));
    }

    @Test
    void updateStatusBadRequest() throws Exception {
        StatusDto request = StatusDto.builder().nombre("Mantenimiento").build();

        when(service.updateStatus(eq(1L), any(StatusDto.class)))
                .thenThrow(new IllegalArgumentException("Error al actualizar"));

        mockMvc.perform(put("/api/v1/status/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al actualizar estado"))
                .andExpect(jsonPath("$.error").value("Error al actualizar"));
    }

    @Test
    void deleteStatusOk() throws Exception {
        doNothing().when(service).deleteStatus(1L);

        mockMvc.perform(delete("/api/v1/status/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Estado eliminado correctamente"));
    }

    @Test
    void deleteStatusBadRequest() throws Exception {
        doThrow(new IllegalArgumentException("No se puede eliminar")).when(service).deleteStatus(1L);

        mockMvc.perform(delete("/api/v1/status/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al eliminar estado"))
                .andExpect(jsonPath("$.error").value("No se puede eliminar"));
    }
}
