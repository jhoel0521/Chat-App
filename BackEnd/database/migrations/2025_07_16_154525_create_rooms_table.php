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
        Schema::create('rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_private')->default(false);
            $table->boolean('allow_anonymous')->default(true);
            $table->uuid('created_by');
            $table->timestamps();
            
            // Foreign key
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index(['is_private', 'allow_anonymous']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
