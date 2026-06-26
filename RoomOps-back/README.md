# RoomOps
Gestión operativa del equipo de trabajo

## Descripción General

**RoomOps** es una solución integral de gestión operativa diseñada para optimizar la coordinación de limpieza, mantenimiento y asignación de tareas del equipo de trabajo. La plataforma integra una arquitectura cliente-servidor que centraliza el control administrativo mientras facilita la ejecución de tareas en terreno mediante dispositivos móviles.

---

## Descripción del Backend (Server-Side)

La capa Backend de **RoomOps** es una API REST robusta construida sobre Spring Boot que proporciona la lógica de negocio, persistencia de datos y servicios de autenticación/autorización para la plataforma.

El desarrollo se rige bajo los siguientes pilares de arquitectura:

* **API REST estructurada y documentada:** Expone endpoints HTTP para operaciones CRUD sobre entidades de negocio relacionadas con tareas, usuarios y roles, con especificación OpenAPI completamente documentada en Swagger UI.
* **Seguridad basada en tokens JWT:** Implementa autenticación mediante JSON Web Tokens y autorización por roles (RBAC), controlando acceso diferenciado a rutas según permisos del usuario.
* **Persistencia flexible multi-entorno:** Utiliza Spring Data JPA como abstracción de datos, compatible con PostgreSQL en producción y H2 en desarrollo/testing, permitiendo migraciones ágiles entre entornos.
* **Pruebas automatizadas y cobertura medible:** Incluye test suite completo con JUnit 5, Spring Test y Spring Security Test, con reportes de cobertura generados por JaCoCo para validar calidad del código.
* **Gestión de dependencias y construcción:** Utiliza Maven para orquestación de compilación, ejecución de tests, análisis de cobertura y empaquetado de artefactos JAR para despliegue.

### Tecnologías del Backend Utilizadas

* **Spring Boot (v3.3.5):** Framework principal para el desarrollo de aplicaciones backend en Java, utilizado como base para la configuración del proyecto, la ejecución del servidor y la integración de módulos. Disponible en: https://spring.io/projects/spring-boot
* **Java (v17):** Lenguaje y versión de la plataforma utilizados para implementar la lógica de negocio del sistema backend. Disponible en: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
* **Spring Boot Starter Web / Spring MVC:** Módulo utilizado para la construcción de APIs REST, exposición de endpoints HTTP y manejo de solicitudes/respuestas. Disponible en: https://docs.spring.io/spring-framework/reference/web/webmvc.html
* **Spring Data JPA:** Abstracción de persistencia para acceso a datos, utilizada para la gestión de repositorios, entidades y operaciones CRUD sobre la base de datos. Disponible en: https://spring.io/projects/spring-data-jpa
* **Spring Security:** Módulo de seguridad para autenticación y autorización, utilizado para proteger rutas del backend y controlar acceso por roles. Disponible en: https://spring.io/projects/spring-security
* **JJWT (v0.12.6):** Librería para JSON Web Tokens en Java, utilizada para la generación y validación de tokens JWT en el proceso de autenticación. Disponible en: https://github.com/jwtk/jjwt
* **Springdoc OpenAPI Starter WebMVC UI (v2.6.0):** Herramienta de documentación de APIs utilizada para generar automáticamente la especificación OpenAPI y visualizar/probar endpoints en Swagger UI. Disponible en: https://springdoc.org/
* **PostgreSQL:** Sistema gestor de base de datos relacional utilizado como base de datos principal en entornos productivos. Disponible en: https://www.postgresql.org/
* **H2 Database:** Base de datos en memoria para desarrollo y pruebas, utilizada como alternativa liviana para ejecución local y testing. Disponible en: https://www.h2database.com/
* **Project Lombok:** Librería para reducción de código boilerplate en Java, utilizada para generar automáticamente getters, setters, builders y constructores. Disponible en: https://projectlombok.org/
* **Apache Maven:** Herramienta de gestión y construcción de proyectos Java, utilizada para administración de dependencias, compilación, pruebas y empaquetado del backend. Disponible en: https://maven.apache.org/
* **JUnit 5 y Spring Test:** Frameworks para pruebas unitarias e integración, utilizados para validar controladores, servicios y componentes del backend. Disponible en: https://junit.org/junit5/
* **Spring Security Test:** Extensión de pruebas para escenarios de autenticación/autorización en componentes protegidos con Spring Security. Disponible en: https://docs.spring.io/spring-security/reference/servlet/test/index.html
* **JaCoCo (v0.8.11):** Herramienta de cobertura de pruebas utilizada para generar reportes de cobertura del código durante la ejecución de tests. Disponible en: https://www.jacoco.org/jacoco/
