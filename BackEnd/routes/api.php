<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GuestController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\UserController;

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
    
    // 👤 Perfil de usuario
    Route::get('/profile', [UserController::class, 'profile']);
    Route::patch('/profile', [UserController::class, 'updateProfile']);
    Route::patch('/profile/password', [UserController::class, 'changePassword']);
    Route::post('/profile/photo', [UserController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo', [UserController::class, 'deleteProfilePhoto']);
    Route::post('/profile/delete', [UserController::class, 'deleteAccount']);
    Route::delete('/profile', [UserController::class, 'deleteAccount']);
});

// 🏠 Salas - Rutas protegidas
Route::middleware('auth:api')->group(function () {
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/my-rooms', [RoomController::class, 'myRooms']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::get('/rooms/{room}', [RoomController::class, 'show']);
    Route::post('/rooms/{room}/join', [RoomController::class, 'join']);
    Route::post('/rooms/{room}/leave', [RoomController::class, 'leave']);
    
    // 💬 Mensajes HTTP - Endpoints tradicionales
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    
    // 📁 Archivos
    Route::post('/files/upload', [FileController::class, 'upload']);
    Route::get('/files/{file}', [FileController::class, 'show']);
});
