package com.hoteleria.roomsOps.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.hoteleria.roomsOps.dto.ApartmentDto;
import com.hoteleria.roomsOps.service.ApartmentService;

@WebMvcTest(ApartmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApartmentService apartmentService;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void listApartments() throws Exception {
        when(apartmentService.getApartments()).thenReturn(List.of(
                                ApartmentDto.builder().id(1L).nombre("A-101").piso(1).activo(true).build(),
                                ApartmentDto.builder().id(2L).nombre("B-202").piso(2).activo(false).build()));

        mockMvc.perform(get("/api/v1/apartments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nombre").value("A-101"))
                .andExpect(jsonPath("$[0].piso").value(1))
                .andExpect(jsonPath("$[0].activo").value(true))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].nombre").value("B-202"))
                .andExpect(jsonPath("$[1].piso").value(2))
                .andExpect(jsonPath("$[1].activo").value(false));
    }

    @Test
    void createApartmentCreated() throws Exception {
                ApartmentDto request = ApartmentDto.builder().nombre("A-101").piso(1).activo(true).build();
                ApartmentDto created = ApartmentDto.builder().id(10L).nombre("A-101").piso(1).activo(true).build();

        when(apartmentService.createApartment(org.mockito.ArgumentMatchers.any(ApartmentDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/apartments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Apartamento creado correctamente"))
                .andExpect(jsonPath("$.apartment.id").value(10))
                .andExpect(jsonPath("$.apartment.nombre").value("A-101"))
                .andExpect(jsonPath("$.apartment.piso").value(1))
                .andExpect(jsonPath("$.apartment.activo").value(true));
    }

    @Test
    void createApartmentBadRequest() throws Exception {
                ApartmentDto request = ApartmentDto.builder().nombre("A-101").piso(1).activo(true).build();

        when(apartmentService.createApartment(org.mockito.ArgumentMatchers.any(ApartmentDto.class)))
                .thenThrow(new IllegalArgumentException("Error de validacion"));

        mockMvc.perform(post("/api/v1/apartments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al crear apartamento"))
                .andExpect(jsonPath("$.error").value("Error de validacion"));
    }

    @Test
    void getApartmentOk() throws Exception {
        when(apartmentService.findById(7L)).thenReturn(
                                ApartmentDto.builder().id(7L).nombre("C-303").piso(3).activo(true).build());

        mockMvc.perform(get("/api/v1/apartments/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.nombre").value("C-303"))
                .andExpect(jsonPath("$.piso").value(3))
                .andExpect(jsonPath("$.activo").value(true));
    }

    @Test
    void getApartmentNotFound() throws Exception {
        when(apartmentService.findById(99L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/apartments/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Apartamento no encontrado"));
    }

    @Test
    void updateApartmentOk() throws Exception {
                ApartmentDto request = ApartmentDto.builder().nombre("A-101-NEW").piso(2).activo(false).build();
                ApartmentDto updated = ApartmentDto.builder().id(1L).nombre("A-101-NEW").piso(2).activo(false).build();

        when(apartmentService.updateApartment(org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any(ApartmentDto.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/apartments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Apartamento actualizado"))
                .andExpect(jsonPath("$.apartment.id").value(1))
                .andExpect(jsonPath("$.apartment.nombre").value("A-101-NEW"))
                .andExpect(jsonPath("$.apartment.piso").value(2))
                .andExpect(jsonPath("$.apartment.activo").value(false));
    }

    @Test
    void updateApartmentBadRequest() throws Exception {
                ApartmentDto request = ApartmentDto.builder().nombre("X").piso(1).activo(true).build();

        when(apartmentService.updateApartment(org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any(ApartmentDto.class)))
                .thenThrow(new IllegalArgumentException("Apartamento no encontrado"));

        mockMvc.perform(put("/api/v1/apartments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al actualizar apartamento"))
                .andExpect(jsonPath("$.error").value("Apartamento no encontrado"));
    }

    @Test
    void cambiarEstadoOk() throws Exception {
                ApartmentDto updated = ApartmentDto.builder().id(4L).nombre("D-404").piso(4).activo(false).build();

        when(apartmentService.updateEstado(4L, false)).thenReturn(updated);

        mockMvc.perform(patch("/api/v1/apartments/4/estado")
                        .param("activo", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Estado actualizado"))
                .andExpect(jsonPath("$.apartment.id").value(4))
                .andExpect(jsonPath("$.apartment.piso").value(4))
                .andExpect(jsonPath("$.apartment.activo").value(false));
    }

    @Test
    void cambiarEstadoBadRequest() throws Exception {
        when(apartmentService.updateEstado(4L, true))
                .thenThrow(new IllegalArgumentException("Apartamento no encontrado"));

        mockMvc.perform(patch("/api/v1/apartments/4/estado")
                        .param("activo", "true"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al cambiar estado"))
                .andExpect(jsonPath("$.error").value("Apartamento no encontrado"));
    }

    @Test
    void patchApartmentOk() throws Exception {
        ApartmentDto request = ApartmentDto.builder().piso(5).build();
        ApartmentDto updated = ApartmentDto.builder().id(3L).nombre("C-303").piso(5).activo(true).build();

        when(apartmentService.patchApartment(org.mockito.ArgumentMatchers.eq(3L),
                org.mockito.ArgumentMatchers.any(ApartmentDto.class))).thenReturn(updated);

        mockMvc.perform(patch("/api/v1/apartments/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Apartamento actualizado parcialmente"))
                .andExpect(jsonPath("$.apartment.id").value(3))
                .andExpect(jsonPath("$.apartment.nombre").value("C-303"))
                .andExpect(jsonPath("$.apartment.piso").value(5))
                .andExpect(jsonPath("$.apartment.activo").value(true));
    }

    @Test
    void patchApartmentBadRequest() throws Exception {
        ApartmentDto request = ApartmentDto.builder().build();

        when(apartmentService.patchApartment(org.mockito.ArgumentMatchers.eq(3L),
                org.mockito.ArgumentMatchers.any(ApartmentDto.class)))
                .thenThrow(new IllegalArgumentException("Debe enviar al menos nombre o piso para actualizar"));

        mockMvc.perform(patch("/api/v1/apartments/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error al actualizar apartamento"))
                .andExpect(jsonPath("$.error").value("Debe enviar al menos nombre o piso para actualizar"));
    }
}
