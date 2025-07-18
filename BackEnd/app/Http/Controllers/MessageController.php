<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    /**
     * Obtener mensajes de una sala específica con paginación
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'room_id' => 'required|uuid|exists:rooms,id',
                'page' => 'integer|min:1',
                'limit' => 'integer|min:1|max:100'
            ]);

            $roomId = $request->room_id;
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);

            // Verificar que el usuario esté en la sala
            $room = Room::findOrFail($roomId);
            $user = Auth::user();

            if (!$room->users()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'No autorizado para acceder a esta sala'], 403);
            }

            // Obtener mensajes con paginación
            $messages = Message::with(['user:id,name'])
                ->where('room_id', $roomId)
                ->orderBy('created_at', 'desc')
                ->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => [
                    'messages' => $messages->items(),
                    'pagination' => [
                        'current_page' => $messages->currentPage(),
                        'last_page' => $messages->lastPage(),
                        'per_page' => $messages->perPage(),
                        'total' => $messages->total(),
                        'has_more' => $messages->hasMorePages()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener mensajes', [
                'error' => $e->getMessage(),
                'room_id' => $request->room_id ?? null,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'error' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Crear un mensaje nuevo
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'room_id' => 'required|uuid|exists:rooms,id',
                'message' => 'required|string|max:1000',
                'message_type' => 'in:text,image,file'
            ]);

            $user = Auth::user();
            $roomId = $request->room_id;

            // Verificar que el usuario esté en la sala
            $room = Room::findOrFail($roomId);
            if (!$room->users()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'No autorizado para enviar mensajes a esta sala'], 403);
            }

            // Crear el mensaje
            $message = Message::create([
                'room_id' => $roomId,
                'user_id' => $user->id,
                'message' => $request->message,
                'message_type' => $request->get('message_type', 'text')
            ]);

            // Cargar la relación del usuario
            $message->load('user:id,name');

            Log::info('Mensaje creado', [
                'message_id' => $message->id,
                'room_id' => $roomId,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'data' => ['message' => $message]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear mensaje', [
                'error' => $e->getMessage(),
                'room_id' => $request->room_id ?? null,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'error' => 'Error interno del servidor'
            ], 500);
        }
    }
}
