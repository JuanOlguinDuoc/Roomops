# Roomops

Repositorio monolítico que agrupa el frontend y el backend del proyecto **Roomops**. La solución está orientada a digitalizar la gestión operativa del equipo de trabajo, combinando una interfaz de trabajo para operarios y administradores con una capa de servicios para el manejo de la información del sistema.

## Alcance del proyecto

Este repositorio contempla exclusivamente funcionalidades de gestión operativa interna. No incluye ni contempla módulos de gestión de clientes, reservas, pagos, pasarelas de pago, ni flujos comerciales asociados.

### Funcionalidades incluidas

- Gestión de usuarios, autenticación y autorización.
- Definición de roles y permisos.
- Gestión de departamentos.
- Creación y asignación de tareas.
- Control de estados.
- Checklist de tareas.
- Visualización y actualización de tareas.
- Panel de supervisión.
- Integración con API REST.
- Despliegue en cloud.

### Funcionalidades excluidas

- Gestión de clientes.
- Sistema de reservas.
- Pagos y pasarelas de pago.
- Aplicación móvil nativa.
- Notificaciones push.
- Integraciones externas con otros PMS.

## Estructura del repositorio

- `RoomOps-Front/`: aplicación SPA del lado del cliente.
- `RoomOps-back/`: backend del sistema.

## Frontend

La capa frontend está pensada para una experiencia de uso en terreno, con foco en dispositivos móviles y operación rápida sobre tareas operativas. Incluye un tablero Kanban dinámico para mover tareas entre estados como Pendiente, En Progreso, Hecho y Bloqueado, además de consumo de API por entorno, retroalimentación visual inmediata y control de sesión ante respuestas no autorizadas.

### Tecnologías Frontend

- React 19.2.4
- React DOM 19.2.4
- Vite 8.0.4
- CoreUI React 5.10.0
- CoreUI CSS 5.6.1
- Bootstrap 5.3.8
- React Router DOM 7.14.1
- Axios 1.15.1
- @dnd-kit/core 6.3.1
- @dnd-kit/sortable 10.0.0
- @dnd-kit/utilities 3.2.2
- SweetAlert2 11.26.24
- React-Toastify 11.1.0
- Lucide React 1.11.0
- CoreUI Icons 3.1.0 y CoreUI Icons React 2.3.0

## Backend

### Descripción del Backend

La capa backend es una API REST construida con Spring Boot que centraliza la lógica de negocio, la persistencia de datos y los servicios de autenticación y autorización de la plataforma. Su propósito es soportar la operación administrativa y la ejecución de tareas del equipo con una arquitectura cliente-servidor clara.

El desarrollo se apoya en estos pilares:

- API REST estructurada y documentada con OpenAPI y Swagger UI.
- Seguridad basada en JWT y autorización por roles.
- Persistencia flexible con Spring Data JPA, PostgreSQL y H2.
- Pruebas automatizadas con JUnit 5, Spring Test, Spring Security Test y cobertura con JaCoCo.
- Gestión de construcción y empaquetado con Maven.

### Tecnologías Backend

- Java 17
- Spring Boot 3.3.5
- Spring Boot Starter Web / Spring MVC
- Spring Data JPA
- Spring Security
- JJWT 0.12.6
- H2 Database
- PostgreSQL
- Lombok
- Springdoc OpenAPI Starter WebMVC UI 2.6.0
- Spring Boot Test
- Spring Security Test
- Maven
- JaCoCo 0.8.11

## Objetivo general

Centralizar en un solo repositorio la experiencia de usuario, la lógica operativa y la gestión de datos del proyecto Roomops.
