/**
 * Función para asegurar independencia de los tests de samples 
 * y no depender de otro test para tener un token de sesión válido
 */
 async function okLogin()
 {
    // 1. Login como productor (pepe) para obtener un token válido
     const response = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username: 'pepe', password: '12345' }) // Usamos pepe hardcodeado
     });
     const data = await response.json();
     // Guardamos el token para tests de samples
     localStorage.setItem('test_token', data.token);
 }

/**
 * Test: GET /api/samples/my-samples
 */
 testUtils.createTestButton("Test Listar Mis Samples", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // 2. Realizar la petición
    const response = await fetch('/api/samples/my-samples', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/samples/upload (Simulado)
 */
testUtils.createTestButton("Test Subir Sample (Simulado)", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // Creamos un FormData
    const formData = new FormData();
    formData.append('display_name', 'Test Loop Pedagogico');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    //Simulamos un cabecera válida
    const wavHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // "RIFF" en hex
        0x00, 0x00, 0x00, 0x00, // Tamaño dummy (4 bytes)
        0x57, 0x41, 0x56, 0x45, // "WAVE" en hex
        0x66, 0x6D, 0x74, 0x20  // "fmt " en hex
    ]);
    
    //Usamos TextEncoder para convertir el string a bytes válidos
    const dummyContent = new TextEncoder().encode("Simulated Audio Content");
    
    // Simulamos un archivo WAV (Header+Contenido)
    const validBlob = new Blob([wavHeader, dummyContent], { type: 'audio/wav' });
    
    formData.append('audioFile', validBlob, 'DRUM_LOOP_01.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/samples/upload (Simulado)
 */
testUtils.createTestButton("Test Subir Sample Demasiado Grande (Simulado)", async (btn) => {
    //Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // Creamos un FormData
    const formData = new FormData();
    formData.append('display_name', 'Test Loop Pedagogico');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    // Calculamos 6MB en bytes
    const byteSize = 6 * 1024 * 1024;

    // Creamos un arreglo de bytes vacíos con ese peso exacto
    const heavyContent = new Uint8Array(byteSize);

    // Simulamos un archivo WAV (binario que pesa 6MB)
    const blob = new Blob([heavyContent], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'DRUM_LOOP_01.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 413) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/samples/upload (MIME Type Inválido)
 */
testUtils.createTestButton("Test Subir Sample - MIME Type Inválido", async (btn) => {
    // 1. Asegurar y guardar una sesión válida
    await okLogin();
    const token = localStorage.getItem('test_token');
    
    // Creamos un FormData con los campos requeridos
    const formData = new FormData();
    formData.append('display_name', 'Test_MIME_Falso');
    formData.append('category', 'test');
    formData.append('bpm', '120');

    // Simulamos un archivo que renombra un .txt a .wav para evadir validaciones
    const fakeContent = 'Este es texto plano disfrazado de archivo de audio';
    const fakeFile = new Blob([fakeContent], { type: 'audio/wav' });
    
    formData.append('audioFile', fakeFile, 'prueba_falsa.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);

    const esStatus415 = response.status === 415;
    const mensajeCorrecto = data.error === 'El archivo no es un audio válido';
    
    if (esStatus415 && mensajeCorrecto) {
        testUtils.setSuccess(btn);
    }
});