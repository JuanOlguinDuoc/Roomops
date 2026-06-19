package com.hoteleria.roomsOps.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "estados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Status {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String nombre;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public Status(String nombre) {
        this.nombre = nombre;
    }
}
