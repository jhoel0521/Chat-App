<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RoomController extends Controller
{
    /**
     * Listar salas públicas disponibles (las 10 más populares)
     */
    public function index(): JsonResponse
    {
        $rooms = Room::with(['creator:id,name'])
            ->where('is_private', false)
            ->withCount(['users' => function ($query) {
                // Solo contar usuarios que no han abandonado la sala
                $query->whereNull('abandonment_in');
            }])
            ->orderBy('users_count', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'rooms' => $rooms
        ]);
    }

    /**
     * Obtener mis salas (donde soy creador o estoy unido)
     */
    public function myRooms(): JsonResponse
    {
        $userId = auth('api')->id();

        // Salas donde el usuario es creador o está unido (no abandonadas)
        $rooms = Room::with(['creator:id,name'])
            ->where(function ($query) use ($userId) {
                $query->where('created_by', $userId)
                    ->orWhereHas('users', function ($q) use ($userId) {
                        $q->where('room_user.user_id', $userId)
                            ->whereNull('room_user.abandonment_in');
                    });
            })
            ->withCount(['users' => function ($query) {
                $query->whereNull('abandonment_in');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'rooms' => $rooms
        ]);
    }

    /**
     * Crear una nueva sala
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_private' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], 422);
        }

        $room = Room::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_private' => $request->boolean('is_private', false),
            'created_by' => auth('api')->id(),
        ]);

        // Unir al creador automáticamente
        $room->users()->attach(auth('api')->id(), [
            'joined_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sala creada exitosamente',
            'room' => $room->load('creator:id,name')
        ], 201);
    }

    /**
     * Obtener detalles de una sala
     */
    public function show(Room $room): JsonResponse
    {
        // Verificar si el usuario tiene acceso a la sala
        if ($room->is_private && !$room->hasUser(auth('api')->id())) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a esta sala privada'
            ], 403);
        }

        $room->load(['creator:id,name', 'users:id,name,is_anonymous']);

        return response()->json([
            'success' => true,
            'data' => $room
        ]);
    }
    public function check(Room $room): JsonResponse
    {
        $userId = auth('api')->id();
        $isActive = $room->isUserActive($userId);

        return response()->json([
            'data' => [
                'success' => true,
                'room_id' => $room->id,
                'is_active' => $isActive,
                'room' => [
                    'id' => $room->id,
                    'name' => $room->name,
                    'description' => $room->description,
                    'is_private' => $room->is_private,
                ]
            ],
            'message' => 'Verificación de acceso exitosa',
        ], 200);
    }



    /**
     *  Actualizar una sala existente
     */
    public function update(Request $request, Room $room): JsonResponse
    {
        // Verificar si el usuario es el creador de la sala
        if ($room->created_by !== auth('api')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para actualizar esta sala'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_private' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], 422);
        }

        $room->update($request->only(['name', 'description', 'is_private']));

        return response()->json([
            'success' => true,
            'message' => 'Sala actualizada exitosamente',
            'data' => $room->load('creator:id,name')
        ]);
    }
    /**
     * Eliminar una sala
     */
    public function destroy(Room $room): JsonResponse
    {
        // Verificar si el usuario es el creador de la sala
        if ($room->created_by !== auth('api')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar esta sala'
            ], 403);
        }

        // Eliminar la sala y sus relaciones
        $room->users()->detach();
        $room->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sala eliminada exitosamente'
        ]);
    }

    /**
     * Unirse a una sala
     */
    public function join(Request $request, Room $room): JsonResponse
    {
        $userId = auth('api')->id();
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Verificar si el usuario ya está activo en la sala
        if ($room->isUserActive($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Ya estás en esta sala'
            ], 400);
        }

        // Verificar si el usuario abandonó previamente
        if ($room->hasAbandonedUser($user->id)) {
            // Reactivar la membresía
            $room->users()->updateExistingPivot($user->id, [
                'abandonment_in' => null,
                'joined_at' => now() // Opcional: actualizar la fecha de ingreso
            ]);
        } else {
            // Unirse por primera vez
            $room->users()->attach($user->id, [
                'joined_at' => now()
            ]);
        }

        // Crear mensaje del sistema
        Message::create([
            'room_id' => $room->id,
            'user_id' => null,
            'message' => "{$user->name} se unió a la sala",
            'message_type' => 'system',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Te has unido a la sala exitosamente'
        ]);
    }

    /**
     * Abandonar una sala
     */
    public function leave(Request $request, Room $room): JsonResponse
    {
        $userId = auth('api')->id();
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Verificar si está en la sala
        if (!$room->hasUser($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'No estás en esta sala'
            ], 400);
        }

        // Marcar como abandonado
        $room->users()->updateExistingPivot($user->id, [
            'abandonment_in' => now()
        ]);

        // Crear mensaje del sistema
        Message::create([
            'room_id' => $room->id,
            'user_id' => null,
            'message' => "{$user->name} abandonó la sala",
            'message_type' => 'system',
        ]);

        // Emitir evento WebSocket

        return response()->json([
            'success' => true,
            'message' => 'Has abandonado la sala'
        ]);
    }
}
