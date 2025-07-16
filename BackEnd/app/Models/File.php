<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    use HasUuids;

    protected $fillable = [
        'message_id',
        'original_name',
        'filename',
        'file_path',
        'file_size',
        'mime_type'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Mensaje al que pertenece el archivo
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Obtener la URL completa del archivo
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    /**
     * Obtener el tamaño formateado del archivo
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Verificar si es una imagen
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Verificar si es un video
     */
    public function isVideo(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }

    /**
     * Verificar si es un audio
     */
    public function isAudio(): bool
    {
        return str_starts_with($this->mime_type, 'audio/');
    }

    /**
     * Verificar si es un documento
     */
    public function isDocument(): bool
    {
        $documentMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];
        
        return in_array($this->mime_type, $documentMimeTypes);
    }

    /**
     * Obtener el tipo de archivo para la UI
     */
    public function getFileTypeAttribute(): string
    {
        if ($this->isImage()) return 'image';
        if ($this->isVideo()) return 'video';
        if ($this->isAudio()) return 'audio';
        if ($this->isDocument()) return 'document';
        return 'file';
    }

    /**
     * Scopes
     */
    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    public function scopeDocuments($query)
    {
        return $query->whereIn('mime_type', [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]);
    }
}
