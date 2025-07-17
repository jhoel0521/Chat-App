<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Room;
use App\Models\Message;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DebugSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuarios específicos
        $admin = User::create([
            'id' => Str::uuid(),
            'name' => 'Admin User',
            'email' => 'admin@mytimer.com',
            'password' => Hash::make('password'),
            'is_anonymous' => false,
            'profile_photo' => null,
            'email_verified_at' => now(),
        ]);

        $jhoel = User::create([
            'id' => Str::uuid(),
            'name' => 'Jhoel',
            'email' => 'jhoel0521@gmail.com',
            'password' => Hash::make('password'),
            'is_anonymous' => false,
            'profile_photo' => null,
            'email_verified_at' => now(),
        ]);

        // Crear room específico
        $room = Room::create([
            'id' => '019818d2-3be7-73aa-909f-387b36b70c35',
            'name' => 'Chat Debug Room',
            'description' => 'Room for debugging and testing',
            'is_private' => false,
            'created_by' => $admin->id,
        ]);

        // Agregar usuarios al room
        $room->users()->attach([$admin->id, $jhoel->id]);

        // Crear algunos mensajes de prueba
        $messages = [
            [
                'user_id' => $admin->id,
                'message' => 'Hola! Este es un mensaje de prueba del admin',
            ],
            [
                'user_id' => $jhoel->id,
                'message' => 'Hola admin! Mensaje de respuesta para testing',
            ],
            [
                'user_id' => $admin->id,
                'message' => 'Perfecto, el chat está funcionando correctamente',
            ],
        ];

        foreach ($messages as $messageData) {
            Message::create([
                'id' => Str::uuid(),
                'room_id' => $room->id,
                'user_id' => $messageData['user_id'],
                'message' => $messageData['message'],
                'message_type' => 'text',
                'reply_to' => null,
                'created_at' => now(),
            ]);
        }

        $this->command->info('Debug data seeded successfully!');
        $this->command->info('Users created: admin@mytimer.com, jhoel0521@gmail.com (password: password)');
        $this->command->info('Room ID: ' . $room->id);
    }
}
