<?php

use Illuminate\Support\Facades\Broadcast;

// Canal para usuarios individuales
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

// Canal privado para salas (requiere autenticación)
Broadcast::channel('private-room.{roomId}', function ($user, $roomId) {
    return !!$user;
});

// Canal público para salas (no requiere autenticación) - FALLBACK
Broadcast::channel('room.{roomId}', function () {
    return true; // Cualquiera puede acceder
});
