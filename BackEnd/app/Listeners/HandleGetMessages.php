<?php

namespace App\Listeners;

use App\Events\GetMessages;
use App\Events\LoadMessages;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class HandleGetMessages
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(GetMessages $event): void
    {
        $roomId = $event->roomId;
        $timestamp = $event->timestamp;
        $page = $event->page ?? 1;
        $perPage = 10;

        $query = Message::with(['user', 'file'])
            ->where('room_id', $roomId)
            ->orderBy('created_at', 'desc');

        // Si hay timestamp, cargar mensajes más antiguos
        if ($timestamp) {
            $query->where('created_at', '<', $timestamp);
        }

        $messages = $query->limit($perPage + 1)->get();
        
        // Verificar si hay más mensajes
        $hasMore = $messages->count() > $perPage;
        if ($hasMore) {
            $messages = $messages->slice(0, $perPage);
        }

        // Convertir a array y ordenar cronológicamente
        $messagesArray = $messages->reverse()->values()->toArray();
        
        // Obtener timestamp del último mensaje
        $lastTimestamp = $messages->last() ? $messages->last()->created_at : null;

        // Emitir respuesta por WebSocket
        broadcast(new LoadMessages($messagesArray, $roomId, $hasMore, $lastTimestamp));
    }
}
