#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colores para consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

// Función para imprimir con colores
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Función para verificar si existe un directorio
function dirExists(dirPath) {
  return fs.existsSync(dirPath);
}

// Función para verificar si existe un archivo
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Función para matar procesos en puerto específico (Windows)
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}` 
      : `lsof -ti:${port}`;
    
    const child = spawn('cmd', ['/c', command], { shell: true });
    
    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.includes(`:${port}`)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            log(`🔴 Matando proceso en puerto ${port} (PID: ${pid})`, colors.red);
            spawn('taskkill', ['/F', '/PID', pid], { shell: true });
          }
        }
      });
    });
    
    child.on('close', () => {
      resolve();
    });
  });
}

// Función para iniciar un proceso
function startProcess(command, args, options, name, color) {
  return new Promise((resolve, reject) => {
    log(`🚀 Iniciando ${name}...`, color);
    
    const child = spawn(command, args, {
      shell: true,
      stdio: 'pipe',
      ...options
    });

    child.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`${color}[${name}]${colors.reset} ${output}`);
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(`${colors.red}[${name} ERROR]${colors.reset} ${output}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${name} iniciado correctamente`, color);
        resolve(child);
      } else {
        log(`❌ ${name} falló con código ${code}`, colors.red);
        reject(new Error(`${name} falló`));
      }
    });

    child.on('error', (error) => {
      log(`❌ Error iniciando ${name}: ${error.message}`, colors.red);
      reject(error);
    });

    // Resolver inmediatamente para procesos en background
    setTimeout(() => resolve(child), 2000);
  });
}

// Función principal
async function main() {
  const isDebugMode = process.argv.includes('--debug');
  
  log('🎯 Chat App - Iniciador de Servicios', colors.cyan);
  if (isDebugMode) {
    log('🐛 MODO DEBUG ACTIVADO', colors.yellow);
  }
  log('=====================================', colors.cyan);
  
  const backendPath = path.join(__dirname, 'BackEnd');
  const frontendPath = path.join(__dirname, 'FrontEnd');

  // Verificar que los directorios existen
  if (!dirExists(backendPath)) {
    log('❌ No se encontró el directorio BackEnd', colors.red);
    process.exit(1);
  }

  if (!dirExists(frontendPath)) {
    log('❌ No se encontró el directorio FrontEnd', colors.red);
    process.exit(1);
  }

  // Verificar archivos requeridos
  if (!fileExists(path.join(backendPath, 'artisan'))) {
    log('❌ No se encontró el archivo artisan en BackEnd', colors.red);
    process.exit(1);
  }

  if (!fileExists(path.join(frontendPath, 'angular.json'))) {
    log('❌ No se encontró el archivo angular.json en FrontEnd', colors.red);
    process.exit(1);
  }

  try {
    // Limpiar puertos que puedan estar ocupados
    log('🧹 Limpiando puertos ocupados...', colors.yellow);
    await killProcessOnPort(8000); // Laravel API
    await killProcessOnPort(8080); // Laravel Reverb WebSocket
    await killProcessOnPort(4200); // Angular Dev Server
    
    // Esperar un poco para que los procesos se cierren
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Array para almacenar los procesos
    const processes = [];

    // 1. Iniciar Laravel API (Backend)
    log('🔧 Iniciando Laravel API (Backend)...', colors.green);
    const laravelArgs = ['artisan', 'serve', '--host=0.0.0.0', '--port=8000'];
    if (isDebugMode) {
      laravelArgs.push('--verbose');
    }
    const laravelProcess = await startProcess(
      'php',
      laravelArgs,
      { cwd: backendPath },
      'Laravel API',
      colors.green
    );
    processes.push(laravelProcess);

    // Esperar un poco para que Laravel se inicie
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Iniciar Laravel Reverb (WebSocket)
    log('🔧 Iniciando Laravel Reverb (WebSocket)...', colors.magenta);
    const reverbArgs = ['artisan', 'reverb:start', '--host=0.0.0.0', '--port=8080'];
    if (isDebugMode) {
      reverbArgs.push('--debug');
    }
    const reverbProcess = await startProcess(
      'php',
      reverbArgs,
      { cwd: backendPath },
      'Laravel Reverb',
      colors.magenta
    );
    processes.push(reverbProcess);

    // Esperar un poco para que Reverb se inicie
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Iniciar Angular (Frontend)
    log('🔧 Iniciando Angular (Frontend)...', colors.blue);
    const angularArgs = ['serve', '--host=0.0.0.0', '--port=4200'];
    if (isDebugMode) {
      angularArgs.push('--verbose');
    }
    const angularProcess = await startProcess(
      'ng',
      angularArgs,
      { cwd: frontendPath },
      'Angular',
      colors.blue
    );
    processes.push(angularProcess);

    // Mostrar información de los servicios
    log('', colors.white);
    log('🎉 ¡Todos los servicios iniciados correctamente!', colors.green);
    log('=============================================', colors.green);
    log('🌐 Laravel API:      http://localhost:8000', colors.green);
    log('🔌 Laravel Reverb:   ws://localhost:8080', colors.magenta);
    log('🚀 Angular App:      http://localhost:4200', colors.blue);
    log('=============================================', colors.green);
    
    if (isDebugMode) {
      log('', colors.white);
      log('🐛 MODO DEBUG - Información adicional:', colors.yellow);
      log('-------------------------------------', colors.yellow);
      log('📊 Backend Path:     ' + backendPath, colors.white);
      log('📊 Frontend Path:    ' + frontendPath, colors.white);
      log('� Procesos activos: ' + processes.length, colors.white);
      log('📊 Logs detallados:  ACTIVADOS', colors.white);
      log('-------------------------------------', colors.yellow);
    }
    
    log('', colors.white);
    log('�💡 Presiona Ctrl+C para detener todos los servicios', colors.yellow);
    if (isDebugMode) {
      log('🐛 Para testing de WebSocket, revisa los logs de Reverb arriba', colors.yellow);
    }

    // Manejar señales de terminación
    process.on('SIGINT', () => {
      log('', colors.white);
      log('🛑 Deteniendo todos los servicios...', colors.yellow);
      
      processes.forEach((proc, index) => {
        if (proc && !proc.killed) {
          const serviceName = ['Laravel API', 'Laravel Reverb', 'Angular'][index];
          log(`🔴 Deteniendo ${serviceName}...`, colors.red);
          proc.kill('SIGTERM');
        }
      });

      setTimeout(() => {
        log('✅ Todos los servicios detenidos', colors.green);
        process.exit(0);
      }, 2000);
    });

    process.on('SIGTERM', () => {
      processes.forEach(proc => {
        if (proc && !proc.killed) {
          proc.kill('SIGTERM');
        }
      });
      process.exit(0);
    });

  } catch (error) {
    log(`❌ Error iniciando servicios: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  log(`❌ Error fatal: ${error.message}`, colors.red);
  process.exit(1);
});
