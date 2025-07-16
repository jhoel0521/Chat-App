<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('room_id');
            $table->uuid('user_id')->nullable(); // Permitir mensajes de usuarios anónimos
            $table->text('message');
            $table->enum('message_type', ['text', 'image', 'file', 'system'])->default('text');
            $table->string('guest_name')->nullable(); // Para usuarios anónimos
            $table->uuid('reply_to')->nullable(); // Responder a otro mensaje
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reply_to')->references('id')->on('messages')->onDelete('set null');

            // Indexes
            $table->index(['room_id', 'created_at']);
            $table->index('user_id');
            $table->index('message_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
