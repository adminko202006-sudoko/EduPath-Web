<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetOtpNotification extends Notification
{
    use Queueable;

    protected string $otp;

    public function __construct(string $otp)
    {
        $this->otp = $otp;
    }

    /**
     * Send the notification through email.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the password reset OTP email.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('EduPath Password Reset OTP')
            ->greeting('Hello!')
            ->line('We received a request to reset your EduPath password.')
            ->line('Your verification code is:')
            ->line($this->otp)
            ->line('This verification code will expire in 10 minutes.')
            ->line('If you did not request a password reset, you can safely ignore this email.')
            ->salutation('Regards,')
            ->salutation('EduPath - Trinidad Municipal College');
    }
}