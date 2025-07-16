<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Room;

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

// Canal para cada sala de chat
Broadcast::channel('room.{roomId}', function ($user, $roomId) {
    $room = Room::find($roomId);
    
    if (!$room) {
        return false;
    }
    
    // Si es sala privada, verificar que el usuario pertenezca a la sala
    if ($room->is_private) {
        return $room->hasUser($user->id);
    }
    
    // Si es sala pública, cualquier usuario autenticado puede escuchar
    return $user !== null;
});
