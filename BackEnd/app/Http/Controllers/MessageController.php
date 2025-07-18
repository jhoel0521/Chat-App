<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Room;
use App\Events\MessageResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    /**
     * Obtener mensajes de una sala con paginación
     */
    public function getMessages(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'room_id' => 'required|uuid|exists:rooms,id',
                'timestamp' => 'nullable|date',
                'page' => 'integer|min:1',
                'limit' => 'integer|min:1|max:100'
            ]);

            $roomId = $request->room_id;
            $timestamp = $request->timestamp;
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);

            // Verificar que el usuario esté en la sala
            $room = Room::findOrFail($roomId);
            $user = Auth::user();

            if (!$room->users()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'No autorizado para acceder a esta sala'], 403);
            }

            // Construir query de mensajes
            $query = Message::with(['user:id,name'])
                ->where('room_id', '=', $roomId)
                ->orderBy('created_at', 'desc');

            // Filtrar por timestamp si se proporciona (para paginación)
            if ($timestamp) {
                $query->where('created_at', '<', $timestamp);
            }

            // Aplicar paginación
            $messages = $query->take($limit)->get();

            $messages = $messages->values();

            $hasMore = $query->skip($limit)->exists();
            $nextTimestamp = $messages->last()?->created_at;

            Log::info('Mensajes obtenidos', [
                'room_id' => $roomId,
                'user_id' => $user->id,
                'count' => $messages->count(),
                'page' => $page,
                'has_more' => $hasMore
            ]);

            $responseData = [
                'messages' => $messages,
                'has_more' => $hasMore,
                'last_timestamp' => $nextTimestamp
            ];

            if (str_contains($request->path(), 'api/ws/')) {
                event(new MessageResponse($roomId, 'messages.loaded', $responseData));
                Log::info('Respuesta de mensajes enviada por WebSocket broadcasting', [
                    'room_id' => $roomId,
                    'user_id' => $user->id,
                    'messages_count' => $messages->count()
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $responseData
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener mensajes', [
                'error' => $e->getMessage(),
                'room_id' => $request->room_id ?? null,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            // Si es una llamada WebSocket, enviar error por broadcasting
            if (str_contains($request->path(), 'api/ws/')) {
                event(new MessageResponse(
                    $request->room_id ?? 'unknown',
                    'get.messages',
                    ['error' => 'Error interno del servidor']
                ));
            }

            return response()->json([
                'error' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Enviar un mensaje nuevo
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'room_id' => 'required|uuid|exists:rooms,id',
                'content' => 'required|string|max:1000',
                'type' => 'in:text,image,file'
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
                'message' => $request->content,
                'message_type' => $request->get('type', 'text')
            ]);

            // Cargar la relación del usuario
            $message->load('user:id,name');
            $responseData = ['message' => $message];
            if (str_contains($request->path(), 'api/ws/')) {
                event(new MessageResponse($roomId, 'message.send', $responseData));
            }

            return response()->json([
                'success' => true,
                'data' => $responseData
            ]);
        } catch (\Exception $e) {
            Log::error('Error al enviar mensaje', [
                'error' => $e->getMessage(),
                'room_id' => $request->room_id ?? null,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            // Si es una llamada WebSocket, enviar error por broadcasting
            if (str_contains($request->path(), 'api/ws/')) {
                event(new MessageResponse(
                    $request->room_id ?? 'unknown',
                    'message.send',
                    ['error' => 'Error interno del servidor']
                ));
            }

            return response()->json([
                'error' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Obtener mensajes de una sala específica (endpoint tradicional HTTP)
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
            Log::error('Error al obtener mensajes tradicional', [
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
     * Crear un mensaje nuevo (endpoint tradicional HTTP)
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

            // Enviar por broadcasting tradicional
            broadcast(new \App\Events\MessageSent($message, $room))->toOthers();

            Log::info('Mensaje creado tradicionalmente', [
                'message_id' => $message->id,
                'room_id' => $roomId,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'data' => ['message' => $message]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear mensaje tradicional', [
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
