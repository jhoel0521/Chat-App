<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LoadMessages implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $messages;
    public $roomId;
    public $hasMore;
    public $lastTimestamp;

    public function __construct($messages, $roomId, $hasMore = false, $lastTimestamp = null)
    {
        $this->messages = $messages;
        $this->roomId = $roomId;
        $this->hasMore = $hasMore;
        $this->lastTimestamp = $lastTimestamp;
    }

    public function broadcastOn()
    {
        return new Channel('room.' . $this->roomId);
    }

    public function broadcastAs()
    {
        return 'messages.loaded';
    }

    public function broadcastWith()
    {
        return [
            'messages' => $this->messages,
            'has_more' => $this->hasMore,
            'last_timestamp' => $this->lastTimestamp
        ];
    }
}
