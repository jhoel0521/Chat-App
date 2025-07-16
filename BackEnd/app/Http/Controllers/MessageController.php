<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Events\MessageSent;

class MessageController extends Controller
{
    /**
     * Obtener historial de mensajes de una sala
     */
    public function index(Request $request, Room $room): JsonResponse
    {
        // Verificar acceso a la sala
        if ($room->is_private && !$room->hasUser(auth('api')->id())) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta sala'
            ], 403);
        }

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 50);

        $messages = $room->messages()
            ->with(['user:id,name,is_anonymous', 'files'])
            ->latest()
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'messages' => $messages
        ]);
    }

    /**
     * Enviar un nuevo mensaje
     */
    public function store(Request $request, Room $room): JsonResponse
    {
        $userId = auth('api')->id();
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Verificar acceso a la sala
        if ($room->is_private && !$room->hasUser($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta sala'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
            'message_type' => 'in:text,image,file,system',
            'reply_to' => 'nullable|uuid|exists:messages,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], 422);
        }

        $message = Message::create([
            'room_id' => $room->id,
            'user_id' => $user->is_anonymous ? null : $user->id,
            'message' => $request->message,
            'message_type' => $request->get('message_type', 'text'),
            'guest_name' => $user->is_anonymous ? $user->name : null,
            'reply_to' => $request->reply_to,
        ]);

        $message->load(['user:id,name,is_anonymous', 'files']);

        // Emitir evento WebSocket
        broadcast(new MessageSent($message, $room));

        return response()->json([
            'success' => true,
            'message' => 'Mensaje enviado',
            'data' => $message
        ], 201);
    }
}
