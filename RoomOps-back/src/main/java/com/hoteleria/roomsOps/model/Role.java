package com.hoteleria.roomsOps.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public Role(String name) {
        this.name = name;
    }

}