import Swal from "sweetalert2";
import { clearUserSession } from "../service/localStorage.js";

// Confirmación genérica reutilizable en vistas CRUD.
// Retorna true si el usuario confirma, false en caso contrario.
export const confirmAction = async ({
    title = "¿Estás seguro?",
    text = "Esta acción no se puede deshacer",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    icon = "warning"
} = {}) => {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,

        // Colores personalizados del proyecto
        background: '#0e011b',
        color: '#F5F5F5',

        // Botones personalizados
        confirmButtonColor: '#5459AC',
        cancelButtonColor: '#52357B',

        // Textos de botones
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,

        customClass: {
            popup: 'dark-popup',
            title: 'dark-title',
            content: 'dark-content'
        },

        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    });

    return result.isConfirmed;
};

export const confirmLogout = (navigate) => {
    Swal.fire({
        title: "¿Estás seguro que deseas cerrar sesión?",
        text: "Perderás el acceso a tu cuenta",
        icon: "warning",
        showCancelButton: true,
        
        // Colores personalizados del proyecto
        background: '#0e011b', // Mismo fondo oscuro del navbar
        color: '#F5F5F5', // Texto claro
        
        // Botones personalizados
        confirmButtonColor: '#5459AC', // Color primario oscuro
        cancelButtonColor: '#52357B', // Color fondo oscuro
        
        // Textos de botones
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        
        // Estilos adicionales
        customClass: {
            popup: 'dark-popup',
            title: 'dark-title',
            content: 'dark-content'
        },
        
        // Efectos
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            clearUserSession();
            
            Swal.fire({
                title: "¡Sesión cerrada!",
                text: "Has cerrado sesión exitosamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
                
                // Mismo tema para el mensaje de éxito
                background: '#0e011b',
                color: '#F5F5F5',
                
                // Color del icono de éxito
                iconColor: '#7CEBB9', // Color acento verde
                
                customClass: {
                    popup: 'dark-popup success-popup',
                    title: 'dark-title success-title'
                }
            }).then(() => {
                navigate('/login'); // ← Usar React Router navigation
            });
        }
    });
};