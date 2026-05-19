# BiblioIA UADY - Sistema de Recomendación de Libros

Sistema de recomendación de libros basado en servicios web para la Facultad de Ingeniería de la UADY.

## Características

- **Pipeline ETL**: Sincronización con el catálogo RSS de Koha y enriquecimiento con Open Library API.
- **Cold Start**: Onboarding personalizado por carrera, semestre e intereses.
- **Modelo Híbrido**: Combinación de Filtrado Basado en Contenido (TF-IDF) y Filtrado Colaborativo.
- **Caja Blanca**: Explicaciones legibles por humanos para cada recomendación.
- **Web Worker**: Cálculo de similitud de libros off-main-thread en el cliente.
- **Chatbot Inteligente**: Integración con Claude API para consultas de catálogo en lenguaje natural.

## Stack Tecnológico

- **Backend**: Node.js, Express, Better-SQLite3.
- **Frontend**: React, Vite, TailwindCSS.
- **IA**: Anthropic Claude API.

## Instalación

### Requisitos previos
- Node.js v18+
- Una API Key de Anthropic (Claude)

### Pasos

1. **Clonar el repositorio** e instalar dependencias:
   ```bash
   # Servidor
   cd server
   npm install
   
   # Cliente
   cd ../client
   npm install
   ```

2. **Configuración**:
   Crea un archivo `.env` en la carpeta `server/` con:
   ```env
   PORT=3001
   ANTHROPIC_API_KEY=tu_clave_aqui
   ```

3. **Ejecución**:
   ```bash
   # En una terminal (Server)
   cd server
   npm run dev
   
   # En otra terminal (Client)
   cd client
   npm run dev
   ```

4. **Sincronización inicial**:
   Una vez abierta la aplicación (habitualmente en `http://localhost:5173`), haz clic en el botón **"Sincronizar Catálogo"** o ejecuta:
   ```bash
   curl -X POST http://localhost:3001/api/etl/sync
   ```

## Estructura del Proyecto

- `/server`: API REST y lógica de recomendación.
- `/client`: Interfaz de usuario en React.
- `/Equipo`: Información del equipo de desarrollo.
