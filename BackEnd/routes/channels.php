<?php

use Illuminate\Support\Facades\Broadcast;

// Canal para usuarios individuales
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

// ✅ Canal PRESENCE para salas - Permite client events + autenticación
Broadcast::channel('room.{roomId}', function ($user, $roomId) {
    // Usuario autenticado puede unirse y emitir client events
    return [
        'id' => $user->id,
        'name' => $user->name,
        'timestamp' => now()->toISOString()
    ];
});
