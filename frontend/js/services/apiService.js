/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

// Configuración base de la API
const API_URL = "/api";


/**
 * Este es el servicio centralizado para manejar todas las peticiones a la API.
 * Se encarga de agregar el token de autenticación automáticamente, manejar errores y formatear las respuestas.
 * De esta forma, los controladores frontales pueden hacer llamadas limpias y enfocarse en la lógica de UI.
 * Dentro de los posibles errores hay un caso especial: el error de autenticación (401), que debe ser corroborado en toda llamada a la
 * API, independientemente de dónde se origine.
 * Cuando se lanza este error deben suceder dos cosas: se debe mostrar el modal con el error y se debe forzar el logout automático.
 * Por simplicidad, se elige hacerlo en ese orden. Surgen varias alternativas para implementar esto.
 * La implementación original realiza el logout dentro del servicio y delega el modal al bloque catch que recibe el error,
 * pero por la asincronía en la redirección el modal no se muestra. Esto se debe a que el logout limpia la sesión y
 * redirige a la página de login, pero al utilizarse window-location-href, el código sigue ejecutándose, entra al bloque catch y
 * comienza a mostrar el modal, pero es interrumpido por la página de login entrante, lo que hace que el modal no tenga tiempo de renderizarse.
 * 
 * ALTERNATIVAS
 * 
 * (1) Por un lado, se podrían hacer ambas cosas directamente en el servicio y así controlar el flujo de errores y redirecciones,
 * utilizando una promesa vacía para detener la ejecución y que no se siga ejecutando el catch local a cada petición,
 * pero eso acoplaría el servicio con la navegación del sitio (logout) y con la UI (el modal).
 * 
 * (2) Por otro, se podría optar por lanzar el error (ya sea personalizado o no) normalmente y manejar cada caso de error en los controladores frontales,
 * que es donde se encuentra la lógica de UI. De esta forma, el servicio sigue siendo un módulo independiente y reutilizable.
 * Esta segunda alterntiva introduce el inconveniente de que cada controlador frontal debe manejar el caso de error 401 localmente.
 * 
 * (3) Alternativamente, existe la posibilidad de crear un sistema de eventos (o errores) personalizado para manejar este tipo de errores globalmente.
 * Para eventos, su funcionamiento sería el siguiente: el servicio lanzaría un evento personalizado cada vez que ocurre un error 401
 * (a la vez que frenaría la ejecución con una promesa vacía), y luego en el script principal del frontend se escucharía ese evento para
 * mostrar el modal y forzar el logout.
 * Esto permitiría centralizar el manejo de errores de autenticación sin acoplar el servicio a la navegación o a la UI.
 * 
 * (4) Si se manejara mediante errores, sería de la siguiente manera: se podría lanzar un error personalizado desde apiService
 * (por ejemplo, UnauthenticatedError). En primera instancia el mismo sería interceptado por el bloque catch local a la utilización del apiService.
 * Al corroborar que es error 401, se debería relanzar para que pueda ser capturado por un eventListener global (en el script principal del frontend)
 * que se encargue de mostrar el modal y forzar el logout. Este eventListener esperaría un "unhandledrejection" con el error personalizado,
 * y al capturarlo ejecutaría la lógica de mostrar el modal y forzar el logout.
 * 
 * Se elige la alternativa (3), aunque la (4) también es una opción válida.
 * La (3) es más sencilla de implementar y entender, aunque la (4) es más robusta y escalable.
 */

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
        const result = await response.json();

        // Si el endpoint es el de login, no se lanza el evento porque es normal que pueda fallar por credenciales incorrectas, y no queremos forzar un logout en ese caso
        // En rigor, sería más prolijo validar el mensaje de error específico del backend, pero para simplificar se asume que cualquier 401 fuera del login es por token inválido o expirado
        if (response.status === 401 && endpoint !== '/auth/login') {        
            // Lanzar un evento personalizado para manejar el error de autenticación globalmente
            const event = new CustomEvent('unauthenticated', { detail: response.status });
            window.dispatchEvent(event);
            // Detener la ejecución para que no se siga ejecutando el bloque catch local
            return new Promise(() => {});
        }

        if (!response.ok) throw new Error(result.message || 'Error en la petición');
        return result;
    }
};