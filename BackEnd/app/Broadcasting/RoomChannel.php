<?php

namespace App\Broadcasting;

use App\Events\MessageResponse;
use App\Http\Controllers\MessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RoomChannel
{
    /**
     * Create a new channel instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Authenticate the user's access to the channel.
     */
    public function join($user, $roomId)
    {
        // Verificar que el usuario esté en la sala
        return [
            'id' => $user->id,
            'name' => $user->name,
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Handle client events
     */
    public function handleClientEvent($user, $roomId, $eventName, $data)
    {
        Log::info('Cliente evento recibido', [
            'user_id' => $user->id,
            'room_id' => $roomId,
            'event' => $eventName,
            'data' => $data
        ]);

        try {
            switch ($eventName) {
                case 'get.messages':
                    $this->handleGetMessages($user, $roomId, $data);
                    break;
                    
                case 'message.send':
                    $this->handleSendMessage($user, $roomId, $data);
                    break;
                    
                default:
                    Log::warning('Evento de cliente no reconocido', [
                        'event' => $eventName,
                        'user_id' => $user->id,
                        'room_id' => $roomId
                    ]);
            }
        } catch (\Exception $e) {
            Log::error('Error procesando evento de cliente', [
                'error' => $e->getMessage(),
                'event' => $eventName,
                'user_id' => $user->id,
                'room_id' => $roomId
            ]);
        }
    }

    /**
     * Handle get messages request
     */
    private function handleGetMessages($user, $roomId, $data)
    {
        try {
            // Configurar autenticación para el request
            Auth::setUser($user);
            
            // Crear request con los datos del evento
            $requestData = array_merge($data, ['room_id' => $roomId]);
            $request = new Request($requestData);
            
            // Usar el controlador para procesar
            $controller = app(MessageController::class);
            $response = $controller->getMessages($request);
            $responseData = json_decode($response->getContent(), true);

            // Emitir respuesta vía broadcasting
            if ($responseData['success'] ?? false) {
                event(new MessageResponse(
                    $roomId,
                    'get.messages',
                    $responseData['data']
                ));
            } else {
                event(new MessageResponse(
                    $roomId,
                    'get.messages',
                    ['error' => $responseData['error'] ?? 'Error desconocido']
                ));
            }

        } catch (\Exception $e) {
            Log::error('Error en handleGetMessages', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'room_id' => $roomId
            ]);
            
            event(new MessageResponse(
                $roomId,
                'get.messages',
                ['error' => 'Error interno del servidor']
            ));
        }
    }

    /**
     * Handle send message request
     */
    private function handleSendMessage($user, $roomId, $data)
    {
        try {
            // Configurar autenticación para el request
            Auth::setUser($user);
            
            // Crear request con los datos del evento
            $requestData = array_merge($data, ['room_id' => $roomId]);
            $request = new Request($requestData);
            
            // Usar el controlador para procesar
            $controller = app(MessageController::class);
            $response = $controller->sendMessage($request);
            $responseData = json_decode($response->getContent(), true);

            // Emitir respuesta vía broadcasting
            if ($responseData['success'] ?? false) {
                event(new MessageResponse(
                    $roomId,
                    'message.send',
                    $responseData['data']
                ));
            } else {
                event(new MessageResponse(
                    $roomId,
                    'message.send',
                    ['error' => $responseData['error'] ?? 'Error desconocido']
                ));
            }

        } catch (\Exception $e) {
            Log::error('Error en handleSendMessage', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'room_id' => $roomId
            ]);
            
            event(new MessageResponse(
                $roomId,
                'message.send',
                ['error' => 'Error interno del servidor']
            ));
        }
    }
}
