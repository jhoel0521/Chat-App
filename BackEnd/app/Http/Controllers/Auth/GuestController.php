<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class GuestController extends Controller
{
    /**
     * Inicializar sesión como usuario anónimo
     */
    public function init(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Nombre requerido',
                'errors' => $validator->errors()
            ], 422);
        }

        // Crear usuario anónimo
        $user = User::create([
            'name' => $request->name,
            'email' => null,
            'password' => null,
            'is_anonymous' => true,
        ]);

        $token = JWTAuth::fromUser($user);
        $ttl = config('jwt.ttl') * 60;
        return response()->json([
            'success' => true,
            'message' => 'Sesión anónima iniciada',
            'user' => $user,
            'token' => $token,
            'expires_in' => $ttl,
        ], 201);
    }

    /**
     * Convertir usuario anónimo en registrado
     */
    public function upgrade(Request $request): JsonResponse
    {
        $userId = auth('api')->id();
        $user = User::find($userId);

        // Verificar que el usuario existe
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Verificar que es un usuario anónimo
        if (!$user->is_anonymous) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ya está registrado'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Actualizar usuario manteniendo el UUID
        $user->update([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_anonymous' => false,
        ]);

        // Generar nuevo token
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Usuario convertido exitosamente. Tus mensajes se han conservado.',
            'user' => $user->fresh(),
            'token' => $token,
        ]);
    }
}
