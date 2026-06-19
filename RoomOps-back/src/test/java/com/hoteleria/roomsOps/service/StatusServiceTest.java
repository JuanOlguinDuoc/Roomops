package com.hoteleria.roomsOps.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hoteleria.roomsOps.dto.StatusDto;
import com.hoteleria.roomsOps.model.Status;
import com.hoteleria.roomsOps.repository.StatusRepo;

@ExtendWith(MockitoExtension.class)
class StatusServiceTest {

    @Mock
    private StatusRepo statusRepo;

    @InjectMocks
    private StatusService service;

    @Test
    void getAllStatusOk() {
        when(statusRepo.findAll()).thenReturn(List.of(
                Status.builder().id(1L).nombre("Disponible").build(),
                Status.builder().id(2L).nombre("Ocupado").build()));

        List<StatusDto> result = service.getAllStatus();

        assertEquals(2, result.size());
        assertEquals("Disponible", result.get(0).getNombre());
        assertEquals("Ocupado", result.get(1).getNombre());
    }

    @Test
    void getStatusByIdFound() {
        when(statusRepo.findById(1L)).thenReturn(Optional.of(Status.builder().id(1L).nombre("Disponible").build()));

        StatusDto result = service.getStatusById(1L);

        assertEquals(1L, result.getId());
        assertEquals("Disponible", result.getNombre());
    }

    @Test
    void getStatusByIdMissing() {
        when(statusRepo.findById(99L)).thenReturn(Optional.empty());

        StatusDto result = service.getStatusById(99L);

        assertNull(result);
    }

    @Test
    void createStatusOk() {
        StatusDto dto = StatusDto.builder().nombre("Mantenimiento").build();
        Status saved = Status.builder().id(10L).nombre("Mantenimiento").build();

        when(statusRepo.save(any(Status.class))).thenReturn(saved);

        StatusDto result = service.createStatus(dto);

        assertEquals(10L, result.getId());
        assertEquals("Mantenimiento", result.getNombre());
    }

    @Test
    void updateStatusFound() {
        Status existing = Status.builder().id(1L).nombre("Disponible").build();
        StatusDto request = StatusDto.builder().nombre("Mantenimiento").build();

        when(statusRepo.findById(1L)).thenReturn(Optional.of(existing));
        when(statusRepo.save(any(Status.class))).thenAnswer(inv -> inv.getArgument(0));

        StatusDto result = service.updateStatus(1L, request);

        assertEquals(1L, result.getId());
        assertEquals("Mantenimiento", result.getNombre());
    }

    @Test
    void updateStatusMissingReturnsNull() {
        StatusDto request = StatusDto.builder().nombre("Mantenimiento").build();
        when(statusRepo.findById(99L)).thenReturn(Optional.empty());

        StatusDto result = service.updateStatus(99L, request);

        assertNull(result);
    }

    @Test
    void deleteStatusOk() {
        service.deleteStatus(5L);
        verify(statusRepo).deleteById(5L);
    }

    @Test
    void deleteStatusPropagatesException() {
        org.mockito.Mockito.doThrow(new RuntimeException("fallo"))
                .when(statusRepo).deleteById(7L);

        assertThrows(RuntimeException.class, () -> service.deleteStatus(7L));
    }
}
