// Laravel Echo types
declare module 'laravel-echo' {
  import Pusher from 'pusher-js';
  
  interface EchoOptions {
    broadcaster: string;
    key: string;
    wsHost: string;
    wsPort: number;
    wssPort: number;
    forceTLS: boolean;
    enabledTransports: string[];
    auth?: {
      headers: any;
    };
    authEndpoint?: string;
  }

  interface Channel {
    listen(event: string, callback: (data: any) => void): Channel;
    listenForWhisper(event: string, callback: (data: any) => void): Channel;
    whisper(event: string, data: any): Channel;
  }

  interface PrivateChannel extends Channel {
    // private channel methods
  }

  interface Echo {
    private(channel: string): PrivateChannel;
    channel(channel: string): Channel;
    leave(channel: string): void;
    disconnect(): void;
    connector: {
      pusher: Pusher;
    };
  }

  interface EchoStatic {
    new (options: EchoOptions): Echo;
  }

  const Echo: EchoStatic;
  export default Echo;
}
