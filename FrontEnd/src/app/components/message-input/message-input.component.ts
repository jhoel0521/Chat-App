import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MessageInputData {
  message: string;
}

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.css'
})
export class MessageInputComponent {
  @Input() disabled = false;
  @Input() placeholder = 'Escribe tu mensaje...';
  @Input() maxLength = 1000;
  @Output() sendMessage = new EventEmitter<MessageInputData>();

  message = '';

  handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.message.trim() && !this.disabled) {
      this.sendMessage.emit({ message: this.message.trim() });
      this.message = '';
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSubmit(event);
    }
  }
}
