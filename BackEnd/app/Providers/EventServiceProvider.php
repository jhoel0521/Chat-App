<?php

namespace App\Providers;

use App\Events\ClientEventReceived;
use App\Listeners\HandleGetMessagesEvent;
use App\Listeners\HandleSendMessageEvent;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // Eventos de Laravel estándar
        'Illuminate\Auth\Events\Login' => [],
        'Illuminate\Auth\Events\Logout' => [],
        
        // Eventos de cliente WebSocket
        'client-get.messages' => [
            HandleGetMessagesEvent::class,
        ],
        'client-message.send' => [
            HandleSendMessageEvent::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();

        // Registrar listeners para eventos de cliente WebSocket
        Event::listen('client-get.messages', HandleGetMessagesEvent::class);
        Event::listen('client-message.send', HandleSendMessageEvent::class);
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
