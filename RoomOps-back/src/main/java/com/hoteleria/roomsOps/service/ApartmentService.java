package com.hoteleria.roomsOps.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hoteleria.roomsOps.dto.ApartmentDto;
import com.hoteleria.roomsOps.model.Apartment;
import com.hoteleria.roomsOps.repository.ApartmentRepo;

@Service
public class ApartmentService {
    
    @Autowired
    private ApartmentRepo repo;

    public List<ApartmentDto> getApartments (){
        return repo.findAll().stream().map(ApartmentDto::fromEntity).collect(Collectors.toList());
    }

    public ApartmentDto createApartment(ApartmentDto dto){
    Apartment a = ApartmentDto.toEntity(dto);
    Apartment saved = repo.save(a);
    return ApartmentDto.fromEntity(saved);
}

    public ApartmentDto findById(Long id){
        return repo.findById(id)
                .map(ApartmentDto::fromEntity)
                .orElse(null);
    }

    public ApartmentDto updateApartment(Long id, ApartmentDto dto){
        Apartment existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apartamento no encontrado"));

        existing.setNombre(dto.getNombre());
        existing.setPiso(dto.getPiso());
        existing.setActivo(dto.getActivo());

        Apartment saved = repo.save(existing);
        return ApartmentDto.fromEntity(saved);
    }

    public ApartmentDto patchApartment(Long id, ApartmentDto dto){
        Apartment existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apartamento no encontrado"));

        boolean hasChanges = false;

        if (dto.getNombre() != null) {
            existing.setNombre(dto.getNombre());
            hasChanges = true;
        }

        if (dto.getPiso() != null) {
            existing.setPiso(dto.getPiso());
            hasChanges = true;
        }

        if (!hasChanges) {
            throw new IllegalArgumentException("Debe enviar al menos nombre o piso para actualizar");
        }

        Apartment saved = repo.save(existing);
        return ApartmentDto.fromEntity(saved);
    }

    public ApartmentDto updateEstado(Long id, Boolean activo){
        Apartment existing = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Apartamento no encontrado"));

        existing.setActivo(activo);

        Apartment saved = repo.save(existing);
        return ApartmentDto.fromEntity(saved);
    }



}
