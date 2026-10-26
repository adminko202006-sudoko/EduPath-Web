<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationCodeNotification extends Notification
{
    public function __construct(public readonly string $code) {}
    public function via(object $notifiable): array { return ['mail']; }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Verify your EduPath email')
            ->line('Enter this code in EduPath to verify your email address:')->line($this->code)
            ->line('This code expires in 10 minutes. Do not share it with anyone.')
            ->line('Email verification is separate from the college review of your school identity.');
    }
}
