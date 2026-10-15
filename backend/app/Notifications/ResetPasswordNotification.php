<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    use Queueable;

    /**
     * Build the password reset email.
     */
    public function toMail($notifiable)
    {
        $frontendUrl = rtrim(
            env('FRONTEND_URL', 'http://localhost:5173'),
            '/'
        );

        $resetUrl = $frontendUrl
            . '/reset-password/'
            . $this->token
            . '?email='
            . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('EduPath Password Reset Request')
            ->greeting('Hello!')
            ->line('We received a request to reset your EduPath password.')
            ->line('Click the button below to create a new password for your account.')
            ->action('Reset Password', $resetUrl)
            ->line('This password reset link will expire in 60 minutes.')
            ->line('If you did not request a password reset, you can safely ignore this email.')
            ->salutation('Regards,')
            ->salutation('EduPath - Trinidad Municipal College');
    }
}