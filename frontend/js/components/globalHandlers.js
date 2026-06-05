/**
 * Handler global para eventos por error de autenticación (401) ocurridos en cuaquier parte del frontend al llamar a la API,
 * (excepto en el endpoint del login, que se maneja aparte porque todavía no entró a la aplicación).
 */

window.addEventListener('unauthenticated', () => {

    /**
     * En este caso, para mantener authHelper en su estado original y que él sea el encargado de limpiar el local storage y redirigir al login,
     * se muestra el modal y, cuando se cierra, se ejecuta authHelper.logout()
     */

    // Mostrar modal de sesión expirada
    showModal('Error de autenticación', 'Sesión inválida o corrompida');

    const modalButton = document.querySelector('#msgModal button');
    if (modalButton) {
        modalButton.addEventListener('click', () => authHelper.logout());
    }
});