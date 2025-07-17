<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasUuids;

    protected $fillable = [
        'room_id',
        'user_id',
        'message',
        'message_type',
        'guest_name',
        'reply_to'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Usuario que envió el mensaje
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Sala a la que pertenece el mensaje
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Archivos adjuntos al mensaje
     */
    public function files(): HasMany
    {
        return $this->hasMany(File::class);
    }

    /**
     * Verificar si el mensaje es de un usuario anónimo
     */
    public function isFromGuest(): bool
    {
        return is_null($this->user_id) && !is_null($this->guest_name);
    }

    /**
     * Obtener el nombre del remitente
     */
    public function getSenderNameAttribute(): string
    {
        if ($this->isFromGuest()) {
            return $this->guest_name ?? 'Anónimo';
        }
        
        return $this->user ? $this->user->name : 'Usuario';
    }

    /**
     * Scopes
     */
    public function scopeByType($query, $type)
    {
        return $query->where('message_type', $type);
    }

    public function scopeInRoom($query, $roomId)
    {
        return $query->where('room_id', $roomId);
    }

    public function scopeFromUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
