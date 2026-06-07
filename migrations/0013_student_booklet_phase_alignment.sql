-- Align requirement phases with the student-facing Your Senior booklet sequence.
-- Keep progress_records untouched so historical progress/audit rows retain their original values.

UPDATE requirements
SET phase = 'start'
WHERE id IN ('req-senior-project-workspace', 'req-resume')
   OR phase IN ('setup', 'purpose');

UPDATE requirements
SET phase = 'phase-1'
WHERE id IN ('req-proposal-draft', 'req-approved-proposal', 'req-research-proposal-challenge')
   OR phase IN ('proposal', 'proposal-and-research');

UPDATE requirements
SET phase = 'phase-2a'
WHERE id = 'req-mentor-meeting-one-plan'
   OR phase IN ('mentor-checkpoints', 'mentor-meetings');

UPDATE requirements
SET phase = 'phase-2b'
WHERE id = 'req-mentor-meeting-two-outline';

UPDATE requirements
SET phase = 'phase-3a'
WHERE id = 'req-presentation-day'
   OR phase IN ('presentation', 'presentation-day', 'presentation-and-celebration');

UPDATE requirements
SET phase = 'phase-3b'
WHERE id = 'req-celebration-day'
   OR phase = 'celebration-day';

UPDATE requirements
SET phase = 'phase-4'
WHERE id IN (
    'req-thanks-and-thanks',
    'req-reflection-best-work',
    'req-reflection-senior-project',
    'req-reflection-tenet-mastery',
    'req-reflection-project-based-learning',
    'req-reflection-next-year-plan'
  )
   OR phase IN ('portfolio', 'reflection-and-archive');

UPDATE requirements
SET phase = 'finish'
WHERE id = 'req-personal-archive-export'
   OR phase = 'wrap-up';
