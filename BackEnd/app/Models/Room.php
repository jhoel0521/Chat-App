<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'is_private',
        'created_by'
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Usuarios que pertenecen a esta sala
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'room_user')
                    ->withPivot(['joined_at', 'abandonment_in']);
    }

    /**
     * Mensajes de esta sala
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Usuario que creó la sala
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Obtener los últimos mensajes
     */
    public function latestMessages($limit = 50)
    {
        return $this->messages()
                    ->with(['user', 'files'])
                    ->latest()
                    ->limit($limit);
    }

    /**
     * Verificar si un usuario pertenece a la sala
     */
    public function hasUser($userId): bool
    {
        return $this->users()->where('user_id', $userId)->exists();
    }
}
