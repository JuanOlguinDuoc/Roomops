import React, { useState } from 'react'
import { showErrorToast, showSuccessToast } from '../../utils/toast.js';
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import './Login.css'

import api, { setAuthToken } from '../../service/api';
import { setUserSession } from '../../service/localStorage';

const decodeJwtPayload = (token) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(atob(padded));
    } catch (e) {
        return null;
    }
};

const resolveRoleFromClaims = (payload = {}) => {
    const directRole = payload.role || payload.rol || payload.userRole || payload.tipoRol;
    if (directRole) return String(directRole).replace(/^ROLE_/, '').toUpperCase();

    const rolesArray = Array.isArray(payload.roles)
        ? payload.roles
        : (Array.isArray(payload.authorities) ? payload.authorities : []);

    if (rolesArray.length > 0) {
        const first = String(rolesArray[0] || '');
        return first.replace(/^ROLE_/, '').toUpperCase();
    }

    return '';
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        let isValid = true;
        const newErrors = { email: '', password: '' }

        if (email == "" || email.length == 0) {
            newErrors.email = 'El correo no puede estar vacio'
            isValid = false;
        }

        if (password == "" || password.length == 0) {
            newErrors.password = 'El password no puede estar vacio'
            isValid = false;
        }

        setErrors(newErrors);
        if (!isValid) {
            Object.values(newErrors)
                .filter(msg => msg !== '')
                .forEach(msg => showErrorToast(msg));
            return;
        }

        setLoading(true);
        try {
            const resp = await api.post('/api/v1/auth/login', { email, password });
            const data = resp.data || {};
            const token = data.token;
            // El backend retorna { token, user: UserDto }
            const userData = data.user || {};

            if (token) {
                // Limpiar datos mockeados del localStorage antes de guardar datos reales del backend
                localStorage.removeItem('roles');
                localStorage.removeItem('registeredUsers');
                localStorage.removeItem('nextUserId');

                // guardar token y configurar instancia api
                setAuthToken(token);

                // Verificar si el usuario está activo
                if (userData.activo === false) {
                    setAuthToken(null);
                    showErrorToast('Tu cuenta está desactivada. Contacta al administrador.');
                    return;
                }

                // Usar directamente el user del response del login (incluye id, email, role, etc.)
                if (userData.id) {
                    setUserSession(userData);
                } else {
                    // Fallback: decodificar JWT si por algún motivo no hay userData
                    const claims = decodeJwtPayload(token) || {};
                    const sessionFromToken = {
                        id: userData.id || claims.userId || claims.id || claims.uid || null,
                        email: userData.email || claims.email || claims.sub || email,
                        name: userData.name || userData.firstName || claims.name || '',
                        firstName: userData.firstName || claims.firstName || '',
                        lastName: userData.lastName || claims.lastName || '',
                        role: userData.role || resolveRoleFromClaims(claims)
                    };
                    setUserSession(sessionFromToken);
                }

                localStorage.setItem('email', userData.email || email);

                showSuccessToast(data.message || 'Inicio de sesión exitoso');
                navigate(redirectTo);
            } else {
                showErrorToast(data.message || 'Credenciales inválidas');
            }
        } catch (err) {
            // Manejar diferentes tipos de error
            if (err.response) {
                // Error del servidor (4xx, 5xx)
                const msg = err.response?.data?.message || 'Credenciales inválidas';
                showErrorToast(msg);
            } else if (err.request) {
                // Error de red
                showErrorToast('Error de conexión. Verifica tu conexión a internet.');
            } else {
                // Otro tipo de error
                showErrorToast('Error inesperado. Inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="form">
                <h2>Inicio de sesión</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Correo Electrónico *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Contraseña *"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

            </div>
        </div>
    )
}