import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../services/room/room.service';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.css'
})
export class ChatHeaderComponent {
  @Input() room: Room | null = null;
  @Input() showBackButton = true;
  @Output() onBack = new EventEmitter<void>();
}
