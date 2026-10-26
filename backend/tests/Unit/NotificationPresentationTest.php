<?php

namespace Tests\Unit;

use App\Models\Notification;
use PHPUnit\Framework\TestCase;

class NotificationPresentationTest extends TestCase
{
    public function test_existing_notices_hide_record_numbers_without_changing_stored_values_or_destinations(): void
    {
        $notification = new Notification([
            'title' => 'Online examination attempt #123 released',
            'message' => 'Application #42: Your score is 85 / 100. Room 12. Read chapter #2.',
            'type' => 'exam',
        ]);
        $notification->id = 99;
        $this->assertSame('Online examination attempt released', $notification->title);
        $this->assertSame('Application: Your score is 85 / 100. Room 12. Read chapter #2.', $notification->message);
        $this->assertSame('Online examination attempt #123 released', $notification->getAttributes()['title']);
        $this->assertSame(99, $notification->toArray()['id']);
        $this->assertSame('online_exam', $notification->toArray()['destination']);
        $this->assertSame($notification->message, $notification->toArray()['message']);
    }

    public function test_null_messages_and_unrelated_numbers_remain_unchanged(): void
    {
        $notification = new Notification(['title' => 'Bring 2 photos by October 30', 'message' => null]);
        $this->assertSame('Bring 2 photos by October 30', $notification->title);
        $this->assertNull($notification->message);
    }
}
