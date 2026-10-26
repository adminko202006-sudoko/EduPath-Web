<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChangedNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your EduPath password was reset')
            ->greeting('Hello!')
            ->line('Your EduPath password has been reset successfully.')
            ->line('Your existing sign-in sessions have been signed out. Please sign in again with your new password.')
            ->line('Your account role, permissions, program assignments, and activation status have not changed.')
            ->line('If you did not make this change, contact the Trinidad Municipal College administrator immediately for identity verification and help securing your account.')
            ->salutation('EduPath - Trinidad Municipal College');
    }
}
