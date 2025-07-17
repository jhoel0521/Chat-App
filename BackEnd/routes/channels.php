<?php

use Illuminate\Support\Facades\Broadcast;

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
Broadcast::channel('private-room.{roomId}', function ($user, $roomId) {
    // Intentar obtener el usuario desde auth:api si $user es null
    if (!$user) {
        $user = auth('api')->user();
    }
    // Verificar si el usuario pertenece a la sala
    return $user && $user->rooms()->where('id', $roomId)->exists();
});
