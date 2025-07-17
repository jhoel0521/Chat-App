<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GuestController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\FileController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// 🔐 Autenticación - Rutas públicas
Route::middleware('guest')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/guest/init', [GuestController::class, 'init']);
});

// 🔐 Autenticación - Rutas protegidas
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/token/refresh', [AuthController::class, 'refresh']);
    Route::patch('/guest/upgrade', [GuestController::class, 'upgrade']);
});

// 🧪 RUTAS DE PRUEBA - WebSocket
Route::get('/test-websocket', function () {
    $roomId = request('room_id', 'test');
    $message = request('message', 'Mensaje de prueba desde Laravel!');
    
    \App\Events\TestMessage::dispatch($message, $roomId);
    
    return response()->json([
        'success' => true,
        'message' => 'Evento enviado',
        'room_id' => $roomId,
        'sent_message' => $message,
        'timestamp' => now()->toISOString()
    ]);
});

// 🏠 Salas - Rutas protegidas
Route::middleware('auth:api')->group(function () {
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/my-rooms', [RoomController::class, 'myRooms']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::get('/rooms/{room}', [RoomController::class, 'show']);
    Route::post('/rooms/{room}/join', [RoomController::class, 'join']);
    Route::post('/rooms/{room}/leave', [RoomController::class, 'leave']);
    
    // 💬 Mensajes
    Route::get('/rooms/{room}/messages', [MessageController::class, 'index']);
    Route::post('/rooms/{room}/messages', [MessageController::class, 'store']);
    
    // 📁 Archivos
    Route::post('/files/upload', [FileController::class, 'upload']);
    Route::get('/files/{file}', [FileController::class, 'show']);
});
