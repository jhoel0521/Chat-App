<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use App\Listeners\HandleGetMessagesEvent;
use App\Listeners\HandleSendMessageEvent;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registrar listeners para eventos de cliente WebSocket
        // Estos eventos son enviados por el cliente vía whisper()
        
        Event::listen('client-get.messages', function ($event) {
            Log::info('Evento client-get.messages recibido', ['event' => $event]);
            app(HandleGetMessagesEvent::class)->handle($event);
        });

        Event::listen('client-message.send', function ($event) {
            Log::info('Evento client-message.send recibido', ['event' => $event]);
            app(HandleSendMessageEvent::class)->handle($event);
        });
    }
}
