#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execAsync = util.promisify(exec);

// Colores para consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
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

// Función para verificar dependencias
async function checkDependencies() {
  log('🔍 Verificando dependencias...', colors.cyan);
  
  const backendPath = path.join(__dirname, 'BackEnd');
  const frontendPath = path.join(__dirname, 'FrontEnd');

  // Verificar vendor de Laravel
  if (!dirExists(path.join(backendPath, 'vendor'))) {
    log('📦 Instalando dependencias de Laravel...', colors.yellow);
    try {
      await execAsync('composer install', { cwd: backendPath });
      log('✅ Dependencias de Laravel instaladas', colors.green);
    } catch (error) {
      log('❌ Error instalando dependencias de Laravel', colors.red);
      log(error.message, colors.red);
      process.exit(1);
    }
  }

  // Verificar node_modules de Angular
  if (!dirExists(path.join(frontendPath, 'node_modules'))) {
    log('📦 Instalando dependencias de Angular...', colors.yellow);
    try {
      await execAsync('npm install', { cwd: frontendPath });
      log('✅ Dependencias de Angular instaladas', colors.green);
    } catch (error) {
      log('❌ Error instalando dependencias de Angular', colors.red);
      log(error.message, colors.red);
      process.exit(1);
    }
  }

  // Verificar archivo .env
  if (!fileExists(path.join(backendPath, '.env'))) {
    log('⚠️  Archivo .env no encontrado en BackEnd', colors.yellow);
    if (fileExists(path.join(backendPath, '.env.example'))) {
      log('📋 Copiando .env.example a .env...', colors.yellow);
      try {
        await execAsync('copy .env.example .env', { cwd: backendPath });
        log('✅ Archivo .env creado. Por favor configúralo antes de continuar.', colors.green);
      } catch (error) {
        log('❌ Error copiando .env.example', colors.red);
      }
    } else {
      log('❌ No se encontró .env.example', colors.red);
    }
  }
}

// Función para matar procesos en puerto específico (Windows)
async function killProcessOnPort(port) {
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
            log(`🔴 Liberando puerto ${port} (PID: ${pid})`, colors.red);
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
      if (code !== 0) {
        log(`❌ ${name} cerrado con código ${code}`, colors.red);
      }
    });

    child.on('error', (error) => {
      log(`❌ Error iniciando ${name}: ${error.message}`, colors.red);
      reject(error);
    });

    // Resolver después de un tiempo para permitir que el proceso inicie
    setTimeout(() => resolve(child), 3000);
  });
}

// Función principal
async function main() {
  log('', colors.white);
  log(`${colors.bold}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.bold}${colors.cyan}║     🎯 Chat App - Service Launcher     ║${colors.reset}`);
  log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);
  log('', colors.white);
  
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
    // Verificar e instalar dependencias
    await checkDependencies();

    // Limpiar puertos que puedan estar ocupados
    log('🧹 Liberando puertos ocupados...', colors.yellow);
    await killProcessOnPort(8000); // Laravel API
    await killProcessOnPort(4200); // Angular Dev Server
    
    // Esperar un poco para que los procesos se cierren
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Array para almacenar los procesos
    const processes = [];

    log('', colors.white);
    log('🔧 Iniciando servicios...', colors.cyan);
    log('', colors.white);

    // 1. Iniciar Laravel API (Backend)
    const laravelProcess = await startProcess(
      'php',
      ['artisan', 'serve', '--host=0.0.0.0', '--port=8000'],
      { cwd: backendPath },
      'Laravel API',
      colors.green
    );
    processes.push(laravelProcess);

    // 2. Iniciar Angular (Frontend)
    const angularProcess = await startProcess(
      'ng',
      ['serve', '--host=0.0.0.0', '--port=4200', '--open'],
      { cwd: frontendPath },
      'Angular',
      colors.blue
    );
    processes.push(angularProcess);

    // Mostrar información de los servicios
    log('', colors.white);
    log(`${colors.bold}${colors.green}🎉 ¡Todos los servicios iniciados correctamente!${colors.reset}`, colors.green);
    log(`${colors.bold}${colors.green}═══════════════════════════════════════════════${colors.reset}`, colors.green);
    log(`${colors.green}🌐 Laravel API:      ${colors.white}http://localhost:8000${colors.reset}`);
    log(`${colors.blue}🚀 Angular App:      ${colors.white}http://localhost:4200${colors.reset}`);
    log(`${colors.bold}${colors.green}═══════════════════════════════════════════════${colors.reset}`, colors.green);
    log('', colors.white);
    log(`${colors.yellow}💡 Presiona Ctrl+C para detener todos los servicios${colors.reset}`);
    log('', colors.white);

    // Manejar señales de terminación
    process.on('SIGINT', () => {
      log('', colors.white);
      log('🛑 Deteniendo todos los servicios...', colors.yellow);
      
      const serviceNames = ['Laravel API', 'Angular'];
      processes.forEach((proc, index) => {
        if (proc && !proc.killed) {
          log(`🔴 Deteniendo ${serviceNames[index]}...`, colors.red);
          proc.kill('SIGTERM');
        }
      });

      setTimeout(() => {
        log('✅ Todos los servicios detenidos', colors.green);
        process.exit(0);
      }, 3000);
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
