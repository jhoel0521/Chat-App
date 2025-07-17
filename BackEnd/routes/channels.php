<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Canal personal para cada usuario
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

// Canal para cada sala de chat (privado)
Broadcast::channel('private-room.{roomId}', function ($user = null, $roomId) {
    Log::info("Acceso a sala privada: $roomId", [
        'user' => $user ? $user->id : 'No user',
        'room' => $roomId
    ]);
    // Forzar autenticación con guard 'api'
    $user = auth('api')->user();

    if (!$user) {
        Log::error('Usuario no autenticado', [
            'token' => request()->header('Authorization'),
            'error' => auth('api')->check() ? 'Authenticated but no user' : 'Not authenticated'
        ]);
        return false;
    }

    // Depuración temporal - permitir todos los accesos
    Log::info("Acceso concedido a sala $roomId para usuario {$user->id}");
    return true;

    // Comentar temporalmente la verificación de sala
    // return $user->rooms()->where('id', $roomId)->exists();
});
