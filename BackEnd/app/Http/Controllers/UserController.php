<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class UserController extends Controller
{
    /**
     * Obtener perfil del usuario actual
     */
    public function profile()
    {
        $userId = auth('api')->id();
        $user = User::findOrFail($userId);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Actualizar perfil del usuario
     */
    public function updateProfile(Request $request)
    {
        $userId = auth('api')->id();
        $user = User::findOrFail($userId);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->name = $request->name;

        // Solo actualizar email si no es anónimo y se proporciona
        if (!$user->is_anonymous && $request->filled('email')) {
            $user->email = $request->email;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente',
            'data' => $user
        ]);
    }

    /**
     * Cambiar contraseña
     */
    public function changePassword(Request $request)
    {
        $userId = auth('api')->id();
        $user = User::findOrFail($userId);

        // Usuarios anónimos no pueden cambiar contraseña
        if ($user->is_anonymous) {
            return response()->json([
                'success' => false,
                'message' => 'Los usuarios anónimos no pueden cambiar la contraseña'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta'
            ], 400);
        }

        // Actualizar contraseña
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña cambiada exitosamente'
        ]);
    }

    /**
     * Subir foto de perfil
     */
    public function uploadProfilePhoto(Request $request)
    {
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpeg,png,gif|max:5120',
        ]);

        $userId = auth('api')->id();
        $user = User::findOrFail($userId);

        // Eliminar foto anterior si existe
        if ($user->profile_photo) {
            Storage::delete('public/profile_photos/' . basename($user->profile_photo));
        }

        // Guardar nueva foto
        $path = $request->file('profile_photo')->store('profile_photos', 'public');
        $user->profile_photo = Storage::url($path);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Foto de perfil actualizada',
            'data' => $user
        ]);
    }

    /**
     * Eliminar foto de perfil
     */
    public function deleteProfilePhoto()
    {
        $userId = auth('api')->id();
        $user = User::findOrFail($userId);

        if ($user->profile_photo) {
            try {
                Storage::delete(str_replace(url('/'), '', $user->profile_photo));
                $user->profile_photo = null;
                $user->save();
            } catch (\Exception $e) {
                // Continue even if file deletion fails
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Foto de perfil eliminada exitosamente',
            'data' => $user
        ]);
    }

    /**
     * Eliminar cuenta
     */
    public function deleteAccount(Request $request)
    {
        $userId = auth('api')->id();
        $user = User::findOrFail($userId);

        // Si no es anónimo, requiere contraseña
        if (!$user->is_anonymous) {
            $validator = Validator::make($request->all(), [
                'password' => 'required'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contraseña requerida'
                ], 422);
            }

            // Obtener la contraseña sin el cast hashed
            $userPassword = $user->getAttributes()['password'] ?? null;
            if (!$userPassword || !Hash::check($request->password, $userPassword)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contraseña incorrecta'
                ], 400);
            }
        }

        try {
            // Eliminar foto de perfil si existe
            if ($user->profile_photo) {
                Storage::delete(str_replace(url('/'), '', $user->profile_photo));
            }

            // Eliminar archivos subidos por el usuario
            $user->files()->delete();

            // Eliminar mensajes del usuario
            $user->messages()->delete();

            // Salir de todas las salas
            $user->rooms()->detach();

            // Eliminar salas creadas por el usuario (esto también eliminará mensajes y archivos relacionados)
            $user->createdRooms()->delete();

            // Eliminar el usuario
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Cuenta eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la cuenta: ' . $e->getMessage()
            ], 500);
        }
    }
}
