<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ClientEventReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $roomId;
    public $eventName;
    public $data;
    public $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $roomId, string $eventName, array $data, int $userId)
    {
        $this->roomId = $roomId;
        $this->eventName = $eventName;
        $this->data = $data;
        $this->userId = $userId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('room.' . $this->roomId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'client.' . $this->eventName;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'event' => $this->eventName,
            'data' => $this->data,
            'user_id' => $this->userId,
            'timestamp' => now()->toISOString()
        ];
    }
}
