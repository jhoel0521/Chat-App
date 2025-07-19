import { Component, Input, Output, EventEmitter, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../services/message/message.service';
import { User } from '../../services/auth/auth.service';
import { MessageComponent } from '../message/message.component';

@Component({
  selector: 'app-messages-list',
  standalone: true,
  imports: [CommonModule, MessageComponent],
  templateUrl: './messages-list.component.html',
  styleUrl: './messages-list.component.css'
})
export class MessagesListComponent implements AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() currentUser: User | null = null;
  @Input() loading = false;

  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('scrollArea') private scrollArea!: ElementRef;

  private shouldScrollToBottom = false;

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnChanges() {
    // Scroll to bottom when new messages are added
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesEnd) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  isMessageAuthor(message: Message): boolean {
    return this.currentUser?.id === message.user_id;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}
