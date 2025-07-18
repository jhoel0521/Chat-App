<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GetMessages implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $roomId;
    public $timestamp;
    public $page;
    public $userId;

    public function __construct($roomId, $timestamp = null, $page = 1, $userId = null)
    {
        $this->roomId = $roomId;
        $this->timestamp = $timestamp;
        $this->page = $page;
        $this->userId = $userId;
    }

    public function broadcastOn()
    {
        return new Channel('room.' . $this->roomId);
    }

    public function broadcastAs()
    {
        return 'get.messages';
    }

    public function broadcastWith()
    {
        return [
            'room_id' => $this->roomId,
            'timestamp' => $this->timestamp,
            'page' => $this->page,
            'user_id' => $this->userId
        ];
    }
}
