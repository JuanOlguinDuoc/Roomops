package com.hoteleria.roomsOps.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hoteleria.roomsOps.model.Status;
import com.hoteleria.roomsOps.repository.StatusRepo;
import com.hoteleria.roomsOps.dto.StatusDto;

@Service
public class StatusService {
    @Autowired
    private StatusRepo statusRepo;

    public List<StatusDto> getAllStatus() {
        return statusRepo.findAll().stream()
                .map(StatusDto::fromEntity)
                .collect(Collectors.toList());
    }

    public StatusDto getStatusById(Long id) {
        return statusRepo.findById(id)
                .map(StatusDto::fromEntity)
                .orElse(null);
    }

    public StatusDto createStatus(StatusDto statusDto) {
        Status status = StatusDto.toEntity(statusDto);
        status = statusRepo.save(status);
        return StatusDto.fromEntity(status);
    }

    public StatusDto updateStatus(Long id, StatusDto statusDto) {
        return statusRepo.findById(id)
                .map(existingStatus -> {
                    existingStatus.setNombre(statusDto.getNombre());
                    existingStatus = statusRepo.save(existingStatus);
                    return StatusDto.fromEntity(existingStatus);
                })
                .orElse(null);
    }

    public void deleteStatus(Long id) {
        statusRepo.deleteById(id);
    }
}
