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
        Schema::create('room_user', function (Blueprint $table) {
            $table->id();
            $table->uuid('room_id');
            $table->uuid('user_id');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('abandonment_in')->nullable();
            
            // Foreign keys
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index(['room_id', 'user_id']);
            $table->index('abandonment_in');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_user');
    }
};
