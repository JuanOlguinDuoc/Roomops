package com.hoteleria.roomsOps.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.hoteleria.roomsOps.model.Apartment;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "Apartment", description = "Representa un apartamento del hotel")
public class ApartmentDto {
    @Schema(description = "Identificador del apartamento", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Nombre o codigo visible del apartamento", example = "A101")
    private String nombre;

    @Schema(description = "Numero de piso donde se ubica el apartamento", example = "1")
    private Integer piso;

    @Schema(description = "Indica si el apartamento se encuentra activo", example = "true")
    private Boolean activo;

    public static ApartmentDto fromEntity (Apartment apartment){
        if (apartment == null) return null;
        return ApartmentDto.builder()
        .id(apartment.getId())
        .nombre(apartment.getNombre())
        .piso(apartment.getPiso())
        .activo(apartment.getActivo())
        .build();
    }

    public static Apartment toEntity (ApartmentDto dto){
        if (dto == null) return null;
        return Apartment.builder()
            .id(dto.getId())
            .nombre(dto.getNombre())
            .piso(dto.getPiso())
            .activo(dto.getActivo())
            .build();
    }
}
