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
                'last_timestamp' => 'nullable|date'
            ]);

            $roomId = $request->room_id;
            $lastTimestamp = $request->last_timestamp;

            // Verificar que el usuario esté en la sala
            $room = Room::findOrFail($roomId);
            $user = Auth::user();

            if (!$room->users()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'No autorizado para acceder a esta sala'], 403);
            }

            // Consulta base
            $query = Message::with(['user:id,name,profile_photo'])
                ->where('room_id', $roomId);

            // Filtrar por timestamp si se proporciona
            if ($lastTimestamp) {
                $query->where('created_at', '>', $lastTimestamp);
            }

            // Ordenar y obtener resultados
            $messages = $query->orderBy('created_at', 'asc')->get();

            // Obtener el último timestamp para la respuesta
            $newLastTimestamp = null;
            if ($messages->isNotEmpty()) {
                $newLastTimestamp = $messages->last()->created_at->toISOString();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'messages' => $messages,
                    'last_timestamp' => $newLastTimestamp
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
            $message->load('user:id,name,profile_photo');

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
