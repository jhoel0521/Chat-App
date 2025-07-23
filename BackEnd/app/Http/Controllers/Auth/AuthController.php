<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
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

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_anonymous' => false,
        ]);

        $token = JWTAuth::fromUser($user);
        $ttl = config('jwt.ttl') * 60;

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user' => $user,
            'token' => $token,
            'expires_in' => $ttl,
        ], 201);
    }

    /**
     * Iniciar sesión
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $user = auth('api')->user();
        $ttl = config('jwt.ttl') * 60;

        return response()->json([
            'success' => true,
            'message' => 'Sesión iniciada exitosamente',
            'user' => $user,
            'token' => $token,
            'expires_in' => $ttl,
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(): JsonResponse
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    /**
     * Obtener usuario actual
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user();
        // obtener todos los mensajes que manda el usuario
        $countMessages = \App\Models\Message::where('user_id', $user->id)->count();
        $user->count_messages = $countMessages;
        $countRoomsCreated = \App\Models\Room::where('created_by', $user->id)->count();
        $user->rooms_count = $countRoomsCreated;
        $countRoomsJoined = \App\Models\Room::whereHas('users', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->count();
        $user->rooms_joined_count = $countRoomsJoined;
        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Renovar token
     */
    public function refresh(): JsonResponse
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }
        $token = JWTAuth::refresh(JWTAuth::getToken());
        $ttl = config('jwt.ttl') * 60;
        return response()->json([
            'success' => true,
            'token' => $token,
            'expires_in' => $ttl,
        ]);
    }
}
