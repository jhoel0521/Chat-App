<?php

namespace App\Listeners;

use App\Events\MessageResponse;
use App\Http\Controllers\MessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class HandleGetMessagesEvent
{
    protected $messageController;

    /**
     * Create the event listener.
     */
    public function __construct(MessageController $messageController)
    {
        $this->messageController = $messageController;
    }

    /**
     * Handle the event.
     */
    public function handle($event): void
    {
        try {
            Log::info('Procesando evento client-get.messages', [
                'event' => $event,
                'data' => $event->data ?? null
            ]);

            // Simular request HTTP para reutilizar el controlador
            $request = new Request($event->data);
            
            // Procesar con el controlador existente
            $response = $this->messageController->getMessages($request);
            $responseData = json_decode($response->getContent(), true);

            // Responder vía WebSocket
            if ($responseData['success'] ?? false) {
                event(new MessageResponse(
                    $event->data['room_id'],
                    'get.messages',
                    $responseData['data']
                ));
            } else {
                event(new MessageResponse(
                    $event->data['room_id'],
                    'get.messages',
                    ['error' => $responseData['error'] ?? 'Error desconocido']
                ));
            }

        } catch (\Exception $e) {
            Log::error('Error procesando get.messages', [
                'error' => $e->getMessage(),
                'event_data' => $event->data ?? null
            ]);

            event(new MessageResponse(
                $event->data['room_id'] ?? 'unknown',
                'get.messages',
                ['error' => 'Error interno del servidor']
            ));
        }
    }
}
