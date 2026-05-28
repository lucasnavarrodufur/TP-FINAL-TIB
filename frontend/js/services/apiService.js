/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

// Configuración base de la API
const API_URL = "/api";

const apiService = {
    // Función centralizada para peticiones Fetch
    async request(endpoint, method = 'GET', data = null, isFormData = false) {
        // Usamos el helper en lugar de acceder directo a localStorage o sessionStorage
        const token = authHelper.getToken();
        
        const headers = {};
        if (!isFormData) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (data) {
            // Si es FormData (para archivos), no se stringifica
            config.body = isFormData ? data : JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        // Si el token expiró (401), forzamos logout automático
        if (response.status === 401) authHelper.logout();

        if (!response.ok) {
            try {
                // Intentamos leer el mensaje de error enviado por el backend
                const errorData = await response.json();
                const mensajeError = errorData.error || errorData.message || `Error del servidor (${response.status})`;
                throw new Error(mensajeError);
                
            } catch (jsonError) {
                // Si la respuesta no es JSON lanzamos mensajes manuales para que el modal no se quede vacío.
                if (response.status === 413) throw new Error("El archivo supera el límite de tamaño permitido");
                if (response.status === 415) throw new Error("El archivo no es un audio válido");
                
                throw new Error(`Error de conexión o respuesta inválida (${response.status})`);
            }
        }

        //Solo si todo salió bien (200 o 201) parseamos el JSON
        return await response.json();
    }
};