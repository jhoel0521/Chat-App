<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FileController extends Controller
{
    /**
     * Subir archivo
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB máximo
            'message_id' => 'required|uuid|exists:messages,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo inválido',
                'errors' => $validator->errors()
            ], 422);
        }

        $uploadedFile = $request->file('file');
        $message = Message::findOrFail($request->message_id);

        // Verificar que el usuario puede subir archivo a este mensaje
        if ($message->user_id !== auth('api')->id() && !$message->isFromGuest()) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para subir archivo a este mensaje'
            ], 403);
        }

        // Generar nombre único
        $filename = Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
        $path = $uploadedFile->storeAs('files', $filename, 'public');

        // Guardar información del archivo
        $file = File::create([
            'message_id' => $message->id,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'filename' => $filename,
            'file_path' => $path,
            'file_size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Archivo subido exitosamente',
            'file' => $file
        ], 201);
    }

    /**
     * Mostrar/descargar archivo
     */
    public function show(File $file)
    {
        if (!Storage::disk('public')->exists($file->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado'
            ], 404);
        }

        return Storage::disk('public')->response($file->file_path, $file->original_name);
    }
}
