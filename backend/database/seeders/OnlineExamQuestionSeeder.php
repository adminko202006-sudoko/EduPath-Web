<?php

namespace Database\Seeders;

use App\Models\OnlineExamOption;
use App\Models\OnlineExamQuestion;
use Illuminate\Database\Seeder;

/**
 * Sample question bank for the Online Examination.
 *
 * These are PLACEHOLDER aptitude questions, tagged with source="sample", so
 * the applicant flow can be exercised before the real bank is authored in the
 * web admin area. Replace or delete them freely:
 *
 *   php artisan tinker --execute="App\Models\OnlineExamQuestion::where('source','sample')->delete();"
 *
 * The seeder is idempotent and never overwrites an existing bank.
 */
class OnlineExamQuestionSeeder extends Seeder
{
    private const SAMPLE_QUESTIONS = [
        [
            'question' => 'Choose the word most similar in meaning to "abundant".',
            'options' => ['Scarce', 'Plentiful', 'Hidden', 'Fragile'],
            'answer' => 1,
        ],
        [
            'question' => 'If 3 machines make 3 toys in 3 minutes, how long do 100 machines take to make 100 toys?',
            'options' => ['100 minutes', '3 minutes', '1 minute', '33 minutes'],
            'answer' => 1,
        ],
        [
            'question' => 'Which number comes next: 2, 4, 8, 16, ...?',
            'options' => ['24', '30', '32', '36'],
            'answer' => 2,
        ],
        [
            'question' => 'A student scores 75, 80 and 90 in three tests. What is the average?',
            'options' => ['80', '82.5', '85', '87'],
            'answer' => 2,
        ],
        [
            'question' => 'Which of these is a primary color?',
            'options' => ['Green', 'Orange', 'Blue', 'Purple'],
            'answer' => 2,
        ],
        [
            'question' => 'Complete the analogy: Book is to Reading as Fork is to ___',
            'options' => ['Drawing', 'Writing', 'Eating', 'Stirring'],
            'answer' => 2,
        ],
        [
            'question' => 'Which planet is known as the Red Planet?',
            'options' => ['Venus', 'Mars', 'Jupiter', 'Mercury'],
            'answer' => 1,
        ],
        [
            'question' => 'What is 15% of 200?',
            'options' => ['15', '25', '30', '35'],
            'answer' => 2,
        ],
        [
            'question' => 'Choose the correctly spelled word.',
            'options' => ['Occurence', 'Occurrence', 'Ocurrence', 'Occurrance'],
            'answer' => 1,
        ],
        [
            'question' => 'If all roses are flowers and some flowers fade quickly, then:',
            'options' => [
                'All roses fade quickly',
                'Some roses fade quickly',
                'No roses fade quickly',
                'Nothing can be concluded about roses',
            ],
            'answer' => 3,
        ],
    ];

    public function run(): void
    {
        if (OnlineExamQuestion::query()->exists()) {
            $this->command?->info('Question bank already populated; nothing seeded.');
            return;
        }

        foreach (self::SAMPLE_QUESTIONS as $index => $entry) {
            $question = OnlineExamQuestion::create([
                'question' => $entry['question'],
                'is_active' => true,
                'source' => 'sample',
            ]);

            foreach ($entry['options'] as $position => $text) {
                OnlineExamOption::create([
                    'online_exam_question_id' => $question->id,
                    'text' => $text,
                    'is_correct' => $position === $entry['answer'],
                    'position' => $position,
                ]);
            }
        }

        $this->command?->info(
            'Seeded ' . count(self::SAMPLE_QUESTIONS) . ' sample online exam questions.'
        );
    }
}
