package com.hoteleria.roomsOps.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    private String descripcion;

    private String tipo;

    private String prioridad;

    private LocalDate fecha;

    private String dueTime; // "15:00"

    @ManyToOne
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "task_checklist", joinColumns = @JoinColumn(name = "task_id"))
    private List<ChecklistItem> checklist = new ArrayList<>();
}

